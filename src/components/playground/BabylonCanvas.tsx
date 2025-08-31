import { useRef, useEffect, useState } from 'react'
import { Engine, Scene, FreeCamera, Vector3, HemisphericLight, MeshBuilder } from '@babylonjs/core'
import { cn } from '@/lib/utils'

interface BabylonCanvasProps {
  code: string
  className?: string
  onSceneReady?: (scene: Scene) => void
  onError?: (error: Error) => void
}

export function BabylonCanvas({ code, className, onSceneReady, onError }: BabylonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const sceneRef = useRef<Scene | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    
    try {
      // Create engine
      const engine = new Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true
      })
      engineRef.current = engine

      // Create default scene
      const scene = new Scene(engine)
      sceneRef.current = scene

      // Create default camera
      const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene)
      camera.setTarget(Vector3.Zero())
      camera.attachControl(canvas, true)

      // Create default light
      const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene)
      light.intensity = 0.7

      // Start render loop
      engine.runRenderLoop(() => {
        scene.render()
      })

      // Handle resize
      const handleResize = () => {
        engine.resize()
      }
      window.addEventListener('resize', handleResize)

      setIsLoading(false)
      onSceneReady?.(scene)

      return () => {
        window.removeEventListener('resize', handleResize)
        scene.dispose()
        engine.dispose()
      }
    } catch (err) {
      console.error('Failed to initialize Babylon.js:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize 3D engine')
      setIsLoading(false)
    }
  }, [onSceneReady])

  useEffect(() => {
    if (!engineRef.current || !canvasRef.current || !code.trim()) return

    try {
      setError(null)
      
      // Create new scene
      const engine = engineRef.current
      const canvas = canvasRef.current
      
      // Dispose previous scene
      if (sceneRef.current) {
        sceneRef.current.dispose()
      }

      // Create fresh scene
      const scene = new Scene(engine)
      sceneRef.current = scene

      // Make globals available for user code
      ;(window as any).BABYLON = { 
        Scene, 
        Engine, 
        FreeCamera, 
        Vector3, 
        HemisphericLight, 
        MeshBuilder,
        // Add more BABYLON classes as needed
      }
      ;(window as any).engine = engine
      ;(window as any).canvas = canvas
      ;(window as any).scene = scene

      // Execute user code
      const userFunction = new Function(code + '\n\nif (typeof createScene === "function") { return createScene(); }')
      const userScene = userFunction()

      if (userScene && userScene.render) {
        sceneRef.current = userScene
        onSceneReady?.(userScene)
      }

    } catch (err) {
      console.error('Error executing user code:', err)
      setError(err instanceof Error ? err.message : 'Error in user code')
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