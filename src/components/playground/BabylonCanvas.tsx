import { useRef, useEffect, useState } from 'react'
import * as BABYLON from '@babylonjs/core'
import '@babylonjs/inspector'
import { cn } from '@/lib/utils'

interface BabylonCanvasProps {
  code: string
  className?: string
  onSceneReady?: (scene: BABYLON.Scene) => void
  onError?: (error: Error) => void
}

export function BabylonCanvas({ code, className, onSceneReady, onError }: BabylonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<BABYLON.Engine | null>(null)
  const sceneRef = useRef<BABYLON.Scene | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    
    try {
      // Create engine
      const engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true,
        adaptToDeviceRatio: true
      })
      engineRef.current = engine

      // Make BABYLON global available
      ;(window as any).BABYLON = BABYLON
      ;(window as any).engine = engine
      ;(window as any).canvas = canvas

      // Create initial scene immediately
      const initialScene = new BABYLON.Scene(engine)
      
      // Add default camera
      const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), initialScene)
      camera.setTarget(BABYLON.Vector3.Zero())
      camera.attachControl(canvas, true)
      
      // Add default light  
      const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), initialScene)
      light.intensity = 0.7
      
      // Add a default sphere
      const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, initialScene)
      sphere.position.y = 1
      
      // Add default ground
      const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 6, height: 6}, initialScene)
      
      sceneRef.current = initialScene
      ;(window as any).scene = initialScene
      
      onSceneReady?.(initialScene)

      // Start render loop
      engine.runRenderLoop(() => {
        if (sceneRef.current) {
          sceneRef.current.render()
        }
      })

      // Debounced resize handler
      const handleResize = () => {
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current)
        }
        
        resizeTimeoutRef.current = setTimeout(() => {
          engine.resize()
        }, 300)
      }
      window.addEventListener('resize', handleResize)

      // Setup ResizeObserver for panel resizing with debouncing
      if (canvasRef.current?.parentElement) {
        resizeObserverRef.current = new ResizeObserver(() => {
          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current)
          }
          
          resizeTimeoutRef.current = setTimeout(() => {
            engine.resize()
          }, 300)
        })
        resizeObserverRef.current.observe(canvasRef.current.parentElement)
      }

      setIsLoading(false)

      return () => {
        window.removeEventListener('resize', handleResize)
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current)
        }
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect()
        }
        if (sceneRef.current) {
          sceneRef.current.dispose()
        }
        engine.dispose()
      }
    } catch (err) {
      console.error('Failed to initialize Babylon.js:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize 3D engine')
      setIsLoading(false)
    }
  }, [onSceneReady])

  const executeCodeWithDelay = (codeToExecute: string) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    // Set executing state
    setIsExecuting(true)
    
    // Set new timeout for 300ms
    debounceTimeoutRef.current = setTimeout(() => {
      if (!engineRef.current || !canvasRef.current) {
        setIsExecuting(false)
        return
      }

      try {
        setError(null)
        
        const engine = engineRef.current
        const canvas = canvasRef.current
        
        // Save current camera state and selected mesh before disposing scene
        let savedCameraState: {
          position: BABYLON.Vector3
          rotation?: BABYLON.Vector3
          target?: BABYLON.Vector3
          alpha?: number
          beta?: number
          radius?: number
          type: string
        } | null = null
        
        let selectedMeshName: string | null = null
        
        if (sceneRef.current) {
          const currentCamera = sceneRef.current.activeCamera
          if (currentCamera) {
            savedCameraState = {
              position: currentCamera.position.clone(),
              type: currentCamera.getClassName()
            }
            
            // Handle different camera types
            if (currentCamera instanceof BABYLON.FreeCamera) {
              savedCameraState.rotation = (currentCamera as BABYLON.FreeCamera).rotation.clone()
              savedCameraState.target = (currentCamera as any).target?.clone()
            } else if (currentCamera instanceof BABYLON.ArcRotateCamera) {
              const arcCamera = currentCamera as BABYLON.ArcRotateCamera
              savedCameraState.alpha = arcCamera.alpha
              savedCameraState.beta = arcCamera.beta
              savedCameraState.radius = arcCamera.radius
              savedCameraState.target = arcCamera.target.clone()
            }
          }
          
          // Save selected mesh name from gizmo manager if available
          const sceneManager = (window as any).sceneManager
          if (sceneManager?.gizmoManager?.attachedMesh) {
            selectedMeshName = sceneManager.gizmoManager.attachedMesh.name
          }
          
          sceneRef.current.dispose()
        }

        let scene: BABYLON.Scene
        
        if (codeToExecute.trim()) {
          // Execute user code
          try {
            // Set up global variables
            ;(window as any).scene = null
            ;(window as any).engine = engine
            ;(window as any).canvas = canvas
            
            // Execute the code
            const userFunction = new Function('BABYLON', 'engine', 'canvas', `
              ${codeToExecute}
              
              // If createScene function exists, call it and return the scene
              if (typeof createScene === "function") {
                return createScene();
              }
              
              // Otherwise return the global scene if it was created
              return window.scene;
            `)
            
            scene = userFunction(BABYLON, engine, canvas)
            
            // If no scene was returned, create a default one
            if (!scene) {
              scene = new BABYLON.Scene(engine)
            }
            
          } catch (userError) {
            console.error('Error in user code:', userError)
            setError(userError instanceof Error ? userError.message : 'Error in user code')
            
            // Create fallback scene
            scene = new BABYLON.Scene(engine)
            
            // Add default content for fallback
            const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene)
            camera.setTarget(BABYLON.Vector3.Zero())
            camera.attachControl(canvas, true)
            
            const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene)
            light.intensity = 0.7
          }
        } else {
          // Create default scene when no code
          scene = new BABYLON.Scene(engine)
          
          // Add default camera
          const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene)
          camera.setTarget(BABYLON.Vector3.Zero())
          camera.attachControl(canvas, true)
          
          // Add default light  
          const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene)
          light.intensity = 0.7
          
          // Add a default sphere
          const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene)
          sphere.position.y = 1
          
          // Add default ground
          const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene)
        }
        
        // Restore camera state if no camera was created by user code and we have saved state
        if (savedCameraState && (!scene.activeCamera || scene.cameras.length === 0)) {
          if (savedCameraState.type === 'FreeCamera') {
            const camera = new BABYLON.FreeCamera("camera1", savedCameraState.position, scene)
            if (savedCameraState.rotation) {
              camera.rotation = savedCameraState.rotation
            }
            if (savedCameraState.target) {
              camera.setTarget(savedCameraState.target)
            }
            camera.attachControl(canvas, true)
          } else if (savedCameraState.type === 'ArcRotateCamera' && savedCameraState.target) {
            const camera = new BABYLON.ArcRotateCamera(
              "camera1", 
              savedCameraState.alpha || 0, 
              savedCameraState.beta || 0, 
              savedCameraState.radius || 10, 
              savedCameraState.target, 
              scene
            )
            camera.attachControl(canvas, true)
          }
        }
        
        sceneRef.current = scene
        ;(window as any).scene = scene
        
        // Inspector is now available via the import
        // The debug layer will be ready when scene.debugLayer.show() is called
        
        // Pass selected mesh name to the scene ready callback for restoration
        ;(scene as any)._selectedMeshName = selectedMeshName
        
        onSceneReady?.(scene)

      } catch (err) {
        console.error('Error setting up scene:', err)
        setError(err instanceof Error ? err.message : 'Error setting up 3D scene')
        onError?.(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsExecuting(false)
      }
    }, 300)
  }

  useEffect(() => {
    executeCodeWithDelay(code)
    
    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [code, onSceneReady, onError])

  return (
    <div className={cn("relative h-full bg-canvas-background", className)}>
      <canvas 
        ref={canvasRef}
        className="w-full h-full block"
        style={{ 
          outline: 'none',
          pointerEvents: 'auto'
        }}
        tabIndex={0}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-canvas-background">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Initializing 3D Engine...</p>
          </div>
        </div>
      )}

      {/* Executing overlay */}
      {isExecuting && !isLoading && (
        <div className="absolute top-4 right-4 bg-card border border-border rounded-lg p-2 shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-muted-foreground">Updating...</span>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-canvas-background/90">
          <div className="bg-card border border-destructive/20 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-destructive mb-2">Rendering Error</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <p className="text-xs text-muted-foreground">
              Check the console for more details or try running the code again.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}