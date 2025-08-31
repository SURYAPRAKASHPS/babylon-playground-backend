import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Save, 
  Eye, 
  Download, 
  Plus, 
  Code, 
  Trash2, 
  Settings,
  FolderOpen
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PlaygroundToolbarProps {
  onRun: () => void
  onSave: () => void
  onInspector: () => void
  onDownload: () => void
  onNew: () => void
  onClear: () => void
  onExamples: () => void
  onSettings: () => void
  language: 'javascript' | 'typescript'
  onLanguageChange: (lang: 'javascript' | 'typescript') => void
  version?: string
  isRunning?: boolean
}

export function PlaygroundToolbar({
  onRun,
  onSave,
  onInspector,
  onDownload,
  onNew,
  onClear,
  onExamples,
  onSettings,
  language,
  onLanguageChange,
  version = "8.25.0",
  isRunning = false
}: PlaygroundToolbarProps) {
  return (
    <div className="h-14 bg-toolbar-background border-b border-toolbar-border flex items-center justify-between px-4 toolbar-glow">
      {/* Left section - Logo and version */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center glow-effect">
            <Code className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Playground</h1>
        </div>
        <Badge variant="outline" className="text-xs">
          {version} (WebGL2)
        </Badge>
      </div>

      {/* Center section - Language toggles */}
      <div className="flex items-center gap-2">
        <div className="flex bg-secondary rounded-lg p-1">
          <Button
            variant={language === 'typescript' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onLanguageChange('typescript')}
            className={cn(
              "text-xs px-3 h-7",
              language === 'typescript' 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            TS
          </Button>
          <Button
            variant={language === 'javascript' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onLanguageChange('javascript')}
            className={cn(
              "text-xs px-3 h-7",
              language === 'javascript' 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Javascript
          </Button>
        </div>
      </div>

      {/* Right section - Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={onRun}
          disabled={isRunning}
          className="bg-success hover:bg-success/90 text-success-foreground"
        >
          <Play className="w-4 h-4 mr-2" />
          Run
        </Button>
        
        <Button variant="ghost" size="sm" onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        
        <Button variant="ghost" size="sm" onClick={onInspector}>
          <Eye className="w-4 h-4 mr-2" />
          Inspector
        </Button>
        
        <Button variant="ghost" size="sm" onClick={onDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        
        <div className="w-px h-4 bg-border mx-1" />
        
        <Button variant="ghost" size="sm" onClick={onNew}>
          <Plus className="w-4 h-4 mr-2" />
          New
        </Button>
        
        <Button variant="ghost" size="sm" onClick={onClear}>
          <Trash2 className="w-4 h-4 mr-2" />
          Clear
        </Button>
        
        <Button variant="ghost" size="sm" onClick={onExamples}>
          <FolderOpen className="w-4 h-4 mr-2" />
          Examples
        </Button>
        
        <Button variant="ghost" size="sm" onClick={onSettings}>
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}