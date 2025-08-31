import { useRef, useEffect, useState } from 'react'
import * as BABYLON from '@babylonjs/core'
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    
    try {
      // Create engine
      const engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true
      })
      engineRef.current = engine

      // Make BABYLON global available
      ;(window as any).BABYLON = BABYLON
      ;(window as any).engine = engine
      ;(window as any).canvas = canvas

      // Start render loop
      engine.runRenderLoop(() => {
        if (sceneRef.current) {
          sceneRef.current.render()
        }
      })

      // Handle resize
      const handleResize = () => {
        engine.resize()
      }
      window.addEventListener('resize', handleResize)

      setIsLoading(false)

      return () => {
        window.removeEventListener('resize', handleResize)
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

  useEffect(() => {
    if (!engineRef.current || !canvasRef.current) return

    try {
      setError(null)
      
      const engine = engineRef.current
      const canvas = canvasRef.current
      
      // Dispose previous scene
      if (sceneRef.current) {
        sceneRef.current.dispose()
      }

      let scene: BABYLON.Scene
      
      if (code.trim()) {
        // Execute user code
        try {
          // Set up global variables
          ;(window as any).scene = null
          ;(window as any).engine = engine
          ;(window as any).canvas = canvas
          
          // Execute the code
          const userFunction = new Function('BABYLON', 'engine', 'canvas', `
            ${code}
            
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
      
      sceneRef.current = scene
      ;(window as any).scene = scene
      
      onSceneReady?.(scene)

    } catch (err) {
      console.error('Error setting up scene:', err)
      setError(err instanceof Error ? err.message : 'Error setting up 3D scene')
      onError?.(err instanceof Error ? err : new Error('Unknown error'))
    }
  }, [code, onSceneReady, onError])

  return (
    <div className={cn("relative h-full bg-canvas-background", className)}>
      <canvas 
        ref={canvasRef}
        className="w-full h-full block"
        style={{ outline: 'none' }}
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