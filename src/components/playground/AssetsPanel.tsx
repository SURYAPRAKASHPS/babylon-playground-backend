import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Box, 
  Circle, 
  Cylinder, 
  Triangle,
  Square,
  Palette,
  Image,
  Lightbulb,
  Camera,
  Move3D
} from 'lucide-react'

interface Asset {
  id: string
  name: string
  type: 'mesh' | 'material' | 'texture' | 'light' | 'camera'
  category: string
  icon: React.ComponentType<{ className?: string }>
  code: string
  preview?: string
}

const BABYLON_ASSETS: Asset[] = [
  // Basic Meshes
  {
    id: 'box',
    name: 'Box',
    type: 'mesh',
    category: 'Basic Shapes',
    icon: Box,
    code: `const box = BABYLON.MeshBuilder.CreateBox("box", {size: 2}, scene);
box.position.y = 1;`
  },
  {
    id: 'sphere',
    name: 'Sphere',
    type: 'mesh',
    category: 'Basic Shapes',
    icon: Circle,
    code: `const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2}, scene);
sphere.position.y = 1;`
  },
  {
    id: 'cylinder',
    name: 'Cylinder',
    type: 'mesh',
    category: 'Basic Shapes',
    icon: Cylinder,
    code: `const cylinder = BABYLON.MeshBuilder.CreateCylinder("cylinder", {height: 3, diameter: 2}, scene);
cylinder.position.y = 1.5;`
  },
  {
    id: 'cone',
    name: 'Cone',
    type: 'mesh',
    category: 'Basic Shapes',
    icon: Triangle,
    code: `const cone = BABYLON.MeshBuilder.CreateCylinder("cone", {height: 3, diameterTop: 0, diameterBottom: 2}, scene);
cone.position.y = 1.5;`
  },
  {
    id: 'plane',
    name: 'Plane',
    type: 'mesh',
    category: 'Basic Shapes',
    icon: Square,
    code: `const plane = BABYLON.MeshBuilder.CreatePlane("plane", {size: 2}, scene);
plane.position.y = 1;`
  },
  {
    id: 'torus',
    name: 'Torus',
    type: 'mesh',
    category: 'Basic Shapes',
    icon: Circle,
    code: `const torus = BABYLON.MeshBuilder.CreateTorus("torus", {diameter: 2, thickness: 0.5}, scene);
torus.position.y = 1;`
  },
  
  // Materials
  {
    id: 'red-material',
    name: 'Red Material',
    type: 'material',
    category: 'Materials',
    icon: Palette,
    code: `const redMaterial = new BABYLON.StandardMaterial("redMaterial", scene);
redMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);`
  },
  {
    id: 'blue-material',
    name: 'Blue Material',
    type: 'material',
    category: 'Materials',
    icon: Palette,
    code: `const blueMaterial = new BABYLON.StandardMaterial("blueMaterial", scene);
blueMaterial.diffuseColor = new BABYLON.Color3(0, 0, 1);`
  },
  {
    id: 'green-material',
    name: 'Green Material',
    type: 'material',
    category: 'Materials',
    icon: Palette,
    code: `const greenMaterial = new BABYLON.StandardMaterial("greenMaterial", scene);
greenMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);`
  },
  {
    id: 'metallic-material',
    name: 'Metallic Material',
    type: 'material',
    category: 'Materials',
    icon: Palette,
    code: `const metallicMaterial = new BABYLON.PBRMaterial("metallicMaterial", scene);
metallicMaterial.baseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
metallicMaterial.metallicFactor = 0.9;
metallicMaterial.roughnessFactor = 0.1;`
  },

  // Lights
  {
    id: 'directional-light',
    name: 'Directional Light',
    type: 'light',
    category: 'Lights',
    icon: Lightbulb,
    code: `const directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(-1, -1, -1), scene);
directionalLight.intensity = 1;`
  },
  {
    id: 'point-light',
    name: 'Point Light',
    type: 'light',
    category: 'Lights',
    icon: Lightbulb,
    code: `const pointLight = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 5, 0), scene);
pointLight.intensity = 1;`
  },
  {
    id: 'spot-light',
    name: 'Spot Light',
    type: 'light',
    category: 'Lights',
    icon: Lightbulb,
    code: `const spotLight = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(0, 5, 0), new BABYLON.Vector3(0, -1, 0), Math.PI / 3, 2, scene);
spotLight.intensity = 1;`
  },

  // Cameras
  {
    id: 'arc-rotate-camera',
    name: 'Arc Rotate Camera',
    type: 'camera',
    category: 'Cameras',
    icon: Camera,
    code: `const arcCamera = new BABYLON.ArcRotateCamera("arcCamera", -Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), scene);
arcCamera.attachControl(canvas, true);`
  },
  {
    id: 'free-camera',
    name: 'Free Camera',
    type: 'camera',
    category: 'Cameras',
    icon: Camera,
    code: `const freeCamera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 5, -10), scene);
freeCamera.setTarget(BABYLON.Vector3.Zero());
freeCamera.attachControl(canvas, true);`
  }
]

interface AssetsPanelProps {
  onAssetDrop: (asset: Asset) => void
  className?: string
}

export function AssetsPanel({ onAssetDrop, className }: AssetsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [draggedAsset, setDraggedAsset] = useState<Asset | null>(null)

  const handleDragStart = (asset: Asset, e: React.DragEvent) => {
    setDraggedAsset(asset)
    e.dataTransfer.setData('application/json', JSON.stringify(asset))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const filteredAssets = BABYLON_ASSETS.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupedAssets = filteredAssets.reduce((groups, asset) => {
    const category = asset.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(asset)
    return groups
  }, {} as Record<string, Asset[]>)

  const getTypeColor = (type: Asset['type']) => {
    switch (type) {
      case 'mesh': return 'bg-blue-500/20 text-blue-400'
      case 'material': return 'bg-purple-500/20 text-purple-400'
      case 'texture': return 'bg-green-500/20 text-green-400'
      case 'light': return 'bg-yellow-500/20 text-yellow-400'
      case 'camera': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <Card className={`assets-panel ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Move3D className="h-5 w-5" />
          Assets Library
        </CardTitle>
        <input
          type="text"
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="p-4 space-y-6">
            {Object.entries(groupedAssets).map(([category, assets]) => (
              <div key={category}>
                <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                  {category}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      draggable
                      onDragStart={(e) => handleDragStart(asset, e)}
                      className="group flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-grab active:cursor-grabbing transition-colors"
                      onClick={() => onAssetDrop(asset)}
                    >
                      <div className="p-2 rounded-md bg-muted">
                        <asset.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">
                            {asset.name}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getTypeColor(asset.type)}`}
                          >
                            {asset.type}
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAssetDrop(asset)
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
                {category !== Object.keys(groupedAssets).slice(-1)[0] && (
                  <Separator className="mt-6" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}