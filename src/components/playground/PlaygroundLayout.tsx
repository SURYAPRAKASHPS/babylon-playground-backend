import { useState, useCallback } from 'react'
import { PlaygroundToolbar } from './PlaygroundToolbar'
import { CodeEditor } from './CodeEditor'
import { BabylonCanvas } from './BabylonCanvas'
import { AssetsPanel } from './AssetsPanel'
import { useSceneManager } from './SceneManager'
import { PlaygroundStorage, PlaygroundScene } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

export function PlaygroundLayout() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState<'javascript' | 'typescript'>('javascript')
  const [isRunning, setIsRunning] = useState(false)
  const [currentScene, setCurrentScene] = useState<PlaygroundScene | null>(null)
  const { toast } = useToast()
  const { getSceneManager } = useSceneManager()

  const handleRun = useCallback(() => {
    setIsRunning(true)
    // The canvas will automatically re-render when code changes
    setTimeout(() => setIsRunning(false), 1000)
  }, [])

  const handleSave = useCallback(async () => {
    try {
      const scene: PlaygroundScene = {
        id: currentScene?.id,
        name: currentScene?.name || `Scene ${new Date().toLocaleString()}`,
        code,
        language
      }
      
      const savedScene = await PlaygroundStorage.saveScene(scene)
      setCurrentScene(savedScene)
      
      toast({
        title: "Scene saved",
        description: `Saved as "${savedScene.name}"`,
      })
    } catch (error) {
      toast({
        title: "Error saving scene",
        description: "Failed to save the current scene",
        variant: "destructive"
      })
    }
  }, [code, language, currentScene, toast])

  const handleNew = useCallback(() => {
    setCode('')
    setCurrentScene(null)
    toast({
      title: "New scene created",
      description: "Starting with a fresh canvas",
    })
  }, [toast])

  const handleClear = useCallback(() => {
    setCode('')
    toast({
      title: "Code cleared",
      description: "Editor has been cleared",
    })
  }, [toast])

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `babylon-scene.${language === 'typescript' ? 'ts' : 'js'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Code downloaded",
      description: `Downloaded as babylon-scene.${language === 'typescript' ? 'ts' : 'js'}`,
    })
  }, [code, language, toast])

  const handleInspector = useCallback(async () => {
    const globalWindow = window as any
    if (globalWindow.scene && globalWindow.scene.debugLayer) {
      if (globalWindow.scene.debugLayer.isVisible()) {
        globalWindow.scene.debugLayer.hide()
        toast({
          title: "Inspector closed",
          description: "Debug panel has been hidden",
        })
      } else {
        // Configure inspector to not take full screen
        await globalWindow.scene.debugLayer.show({
          embedMode: false,
          overlay: true,
          globalRoot: document.body,
          showExplorer: true,
          hideActionTabs: false,
          handleResize: true,
          initialTab: 0
        })
        
        // Adjust inspector position after it's shown
        setTimeout(() => {
          const inspectorHost = document.querySelector('#babylon-inspector-host') || 
                               document.querySelector('.inspector-host') ||
                               document.querySelector('[class*="inspector"]')
          
          if (inspectorHost && inspectorHost instanceof HTMLElement) {
            inspectorHost.style.top = '56px'
            inspectorHost.style.height = 'calc(100vh - 56px)'
            inspectorHost.style.zIndex = '999'
          }
        }, 100)
        
        toast({
          title: "Inspector opened",
          description: "Use the debug panel to inspect and modify your scene",
        })
      }
    } else {
      toast({
        title: "Inspector unavailable",
        description: "No active scene to inspect",
        variant: "destructive"
      })
    }
  }, [toast])

  const handleExamples = useCallback(() => {
    toast({
      title: "Examples",
      description: "Examples gallery coming soon!",
    })
  }, [toast])

  const handleSettings = useCallback(() => {
    toast({
      title: "Settings",
      description: "Settings panel coming soon!",
    })
  }, [toast])

  const handleSceneReady = useCallback((scene: any) => {
    console.log('Scene ready:', scene)
    // Setup scene manager with gizmos and code synchronization
    const sceneManager = getSceneManager()
    sceneManager.setScene(scene, setCode)
    
    // Restore selected mesh if it was saved during code update
    if (scene._selectedMeshName) {
      setTimeout(() => {
        sceneManager.restoreSelection(scene._selectedMeshName)
      }, 100)
    }
    
    // Make scene manager globally available for selection preservation
    ;(window as any).sceneManager = sceneManager
    
    // Handle resize events from the scene manager
    const handleResize = () => {
      sceneManager.handleResize()
    }
    
    // Listen for panel resize events
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [getSceneManager])

  const handleSceneError = useCallback((error: Error) => {
    toast({
      title: "Scene Error",
      description: error.message,
      variant: "destructive"
    })
  }, [toast])

  const handleAssetDrop = useCallback((asset: any) => {
    const sceneManager = getSceneManager()
    sceneManager.addAsset(asset.code, asset.name, asset.type)
    
    toast({
      title: "Asset Added",
      description: `${asset.name} has been added to the scene`,
    })
  }, [getSceneManager, toast])

  return (
    <div className="playground-layout">
      <PlaygroundToolbar
        onRun={handleRun}
        onSave={handleSave}
        onInspector={handleInspector}
        onDownload={handleDownload}
        onNew={handleNew}
        onClear={handleClear}
        onExamples={handleExamples}
        onSettings={handleSettings}
        language={language}
        onLanguageChange={setLanguage}
        isRunning={isRunning}
      />
      
      <ResizablePanelGroup direction="horizontal" className="flex-1 h-[calc(100vh-3.5rem)]">
        {/* Code Editor Panel */}
        <ResizablePanel defaultSize={35} minSize={25}>
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
            className="h-full custom-scrollbar"
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Canvas Panel */}
        <ResizablePanel defaultSize={45} minSize={30}>
          <BabylonCanvas
            code={code}
            onSceneReady={handleSceneReady}
            onError={handleSceneError}
            className="h-full"
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Assets Panel */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <AssetsPanel 
            onAssetDrop={handleAssetDrop}
            className="h-full"
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}