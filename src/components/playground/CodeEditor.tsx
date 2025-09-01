import { useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { cn } from '@/lib/utils'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: 'javascript' | 'typescript'
  className?: string
}

const defaultBabylonCode = `var createScene = function () {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Our built-in 'sphere' shape.
    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);

    // Move the sphere upward 1/2 its height
    sphere.position.y = 1;

    // Our built-in 'ground' shape.
    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);

    return scene;
};`

export function CodeEditor({ value, onChange, language, className }: CodeEditorProps) {
  const editorRef = useRef<any>(null)

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor

    // Configure Monaco theme
    monaco.editor.defineTheme('babylon-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'regexp', foreground: 'D16969' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'class', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
      ],
      colors: {
        'editor.background': '#1a1625',
        'editor.foreground': '#d4d4d8',
        'editor.lineHighlightBackground': '#2a2139',
        'editor.selectionBackground': '#7c3aed4d',
        'editor.inactiveSelectionBackground': '#7c3aed26',
        'editorLineNumber.foreground': '#71717a',
        'editorGutter.background': '#1a1625',
        'editorWidget.background': '#262237',
        'editorWidget.border': '#3f3f46',
        'editorSuggestWidget.background': '#262237',
        'editorSuggestWidget.border': '#3f3f46',
        'editorHoverWidget.background': '#262237',
        'editorHoverWidget.border': '#3f3f46',
      }
    })

    monaco.editor.setTheme('babylon-dark')

    // Add Babylon.js global types
    monaco.languages.typescript.javascriptDefaults.addExtraLib(`
      declare var BABYLON: any;
      declare var engine: any;
      declare var canvas: any;
      declare var scene: any;
    `, 'babylon.d.ts')

    monaco.languages.typescript.typescriptDefaults.addExtraLib(`
      declare var BABYLON: any;
      declare var engine: any;
      declare var canvas: any;
      declare var scene: any;
    `, 'babylon.d.ts')
  }

  const displayValue = value || defaultBabylonCode

  return (
    <div className={cn("h-full bg-editor-background", className)}>
      <Editor
        height="100%"
        language={language}
        value={displayValue}
        onChange={(val, ev) => {
  if (!editorRef.current) return

  const monacoInstance = editorRef.current._monaco
  const model = editorRef.current.getModel?.()

  if (monacoInstance && model) {
    const markers = monacoInstance.editor.getModelMarkers({ resource: model.uri })

    if (markers.length === 0) {
      // ✅ Only send code to canvas when error-free
      onChange(val || '')
    } else {
      // ❌ Block sending bad code
      console.log("Skipped update because of syntax error")
    }
  }
}}
        onMount={handleEditorDidMount}
        options={{
          theme: 'babylon-dark',
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Consolas, "Courier New", monospace',
          lineNumbers: 'on',
          rulers: [],
          wordWrap: 'off',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          detectIndentation: false,
          renderLineHighlight: 'line',
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            useShadows: false,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
          minimap: {
            enabled: false
          },
          contextmenu: true,
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly: false,
          cursorStyle: 'line',
           dragAndDrop: true,
          formatOnType: false,
          formatOnPaste: false,
          autoIndent: 'none',
        }}
      />
    </div>
  )
}