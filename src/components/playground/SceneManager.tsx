import { useCallback, useRef } from 'react'
import * as BABYLON from '@babylonjs/core'

interface SceneObject {
  id: string
  name: string
  type: 'mesh' | 'light' | 'camera' | 'material'
  babylonObject: any
  code: string
}

export class SceneManager {
  private scene: BABYLON.Scene | null = null
  private objects: Map<string, SceneObject> = new Map()
  private gizmoManager: BABYLON.GizmoManager | null = null
  private onCodeUpdate: ((code: string) => void) | null = null

  constructor() {
    this.setupGizmos = this.setupGizmos.bind(this)
    this.addAsset = this.addAsset.bind(this)
    this.updateCode = this.updateCode.bind(this)
  }

  setScene(scene: BABYLON.Scene, onCodeUpdate?: (code: string) => void) {
    this.scene = scene
    this.onCodeUpdate = onCodeUpdate || null
    this.setupGizmos()
  }

  private setupGizmos() {
    if (!this.scene) return

    // Create gizmo manager
    this.gizmoManager = new BABYLON.GizmoManager(this.scene)
    
    // Enable all gizmos
    this.gizmoManager.positionGizmoEnabled = true
    this.gizmoManager.rotationGizmoEnabled = true
    this.gizmoManager.scaleGizmoEnabled = true
    this.gizmoManager.boundingBoxGizmoEnabled = false

    // Style the gizmos for better visibility and usability
    if (this.gizmoManager.gizmos.positionGizmo) {
      // Make position gizmo larger with longer lines
      this.gizmoManager.gizmos.positionGizmo.scaleRatio = 1.5
      
      // Make the lines thicker and longer
      this.gizmoManager.gizmos.positionGizmo.xGizmo.dragBehavior.dragPlaneNormal = new BABYLON.Vector3(0, 0, 1)
      this.gizmoManager.gizmos.positionGizmo.yGizmo.dragBehavior.dragPlaneNormal = new BABYLON.Vector3(1, 0, 0)
      this.gizmoManager.gizmos.positionGizmo.zGizmo.dragBehavior.dragPlaneNormal = new BABYLON.Vector3(0, 1, 0)
      
      // Customize arrow materials for better visibility
      if (this.gizmoManager.gizmos.positionGizmo.xGizmo._arrowMesh) {
        const xMaterial = this.gizmoManager.gizmos.positionGizmo.xGizmo._arrowMesh.material as BABYLON.StandardMaterial
        if (xMaterial) {
          xMaterial.emissiveColor = new BABYLON.Color3(1, 0.2, 0.2)
          xMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0)
        }
      }
      
      if (this.gizmoManager.gizmos.positionGizmo.yGizmo._arrowMesh) {
        const yMaterial = this.gizmoManager.gizmos.positionGizmo.yGizmo._arrowMesh.material as BABYLON.StandardMaterial
        if (yMaterial) {
          yMaterial.emissiveColor = new BABYLON.Color3(0.2, 1, 0.2)
          yMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0)
        }
      }
      
      if (this.gizmoManager.gizmos.positionGizmo.zGizmo._arrowMesh) {
        const zMaterial = this.gizmoManager.gizmos.positionGizmo.zGizmo._arrowMesh.material as BABYLON.StandardMaterial
        if (zMaterial) {
          zMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 1)
          zMaterial.diffuseColor = new BABYLON.Color3(0, 0, 1)
        }
      }
    }
    
    if (this.gizmoManager.gizmos.rotationGizmo) {
      // Make rotation gizmo larger with thicker rings
      this.gizmoManager.gizmos.rotationGizmo.scaleRatio = 1.3
      
      // Enhance rotation ring visibility
      if (this.gizmoManager.gizmos.rotationGizmo.xGizmo._rotationDisplayPlane) {
        const xMaterial = this.gizmoManager.gizmos.rotationGizmo.xGizmo._rotationDisplayPlane.material as BABYLON.StandardMaterial
        if (xMaterial) {
          xMaterial.emissiveColor = new BABYLON.Color3(1, 0.3, 0.3)
          xMaterial.alpha = 0.8
        }
      }
      
      if (this.gizmoManager.gizmos.rotationGizmo.yGizmo._rotationDisplayPlane) {
        const yMaterial = this.gizmoManager.gizmos.rotationGizmo.yGizmo._rotationDisplayPlane.material as BABYLON.StandardMaterial
        if (yMaterial) {
          yMaterial.emissiveColor = new BABYLON.Color3(0.3, 1, 0.3)
          yMaterial.alpha = 0.8
        }
      }
      
      if (this.gizmoManager.gizmos.rotationGizmo.zGizmo._rotationDisplayPlane) {
        const zMaterial = this.gizmoManager.gizmos.rotationGizmo.zGizmo._rotationDisplayPlane.material as BABYLON.StandardMaterial
        if (zMaterial) {
          zMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.3, 1)
          zMaterial.alpha = 0.8
        }
      }
    }
    
    if (this.gizmoManager.gizmos.scaleGizmo) {
      // Make scale gizmo smaller than position gizmo but still visible
      this.gizmoManager.gizmos.scaleGizmo.scaleRatio = 1.0
      
      // Enhance scale handle visibility
      if (this.gizmoManager.gizmos.scaleGizmo.xGizmo._scaleBoxes) {
        this.gizmoManager.gizmos.scaleGizmo.xGizmo._scaleBoxes.forEach((box: BABYLON.AbstractMesh) => {
          const material = box.material as BABYLON.StandardMaterial
          if (material) {
            material.emissiveColor = new BABYLON.Color3(1, 0.4, 0.4)
          }
        })
      }
      
      if (this.gizmoManager.gizmos.scaleGizmo.yGizmo._scaleBoxes) {
        this.gizmoManager.gizmos.scaleGizmo.yGizmo._scaleBoxes.forEach((box: BABYLON.AbstractMesh) => {
          const material = box.material as BABYLON.StandardMaterial
          if (material) {
            material.emissiveColor = new BABYLON.Color3(0.4, 1, 0.4)
          }
        })
      }
      
      if (this.gizmoManager.gizmos.scaleGizmo.zGizmo._scaleBoxes) {
        this.gizmoManager.gizmos.scaleGizmo.zGizmo._scaleBoxes.forEach((box: BABYLON.AbstractMesh) => {
          const material = box.material as BABYLON.StandardMaterial
          if (material) {
            material.emissiveColor = new BABYLON.Color3(0.4, 0.4, 1)
          }
        })
      }
    }

    // Handle mesh selection
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh) {
        const mesh = pointerInfo.pickInfo.pickedMesh
        if (mesh.name !== 'ground' && mesh.name !== 'skybox') {
          if (this.gizmoManager) {
            this.gizmoManager.attachToMesh(mesh)
            this.setupGizmoEvents(mesh)
          }
        }
      }
    })

    // Handle clicks on empty space to deselect
    this.scene.actionManager = new BABYLON.ActionManager(this.scene)
    this.scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPickTrigger,
        (evt) => {
          if (!evt.meshUnderPointer && this.gizmoManager) {
            this.gizmoManager.attachToMesh(null)
          }
        }
      )
    )
  }

  private setupGizmoEvents(mesh: BABYLON.AbstractMesh) {
    if (!this.gizmoManager) return

    const updateCodeFromMesh = () => {
      const obj = Array.from(this.objects.values()).find(
        o => o.babylonObject === mesh
      )
      if (obj) {
        this.updateObjectCode(obj)
      }
    }

    // Position gizmo events
    if (this.gizmoManager.gizmos.positionGizmo) {
      this.gizmoManager.gizmos.positionGizmo.onDragEndObservable.add(() => {
        updateCodeFromMesh()
      })
    }

    // Rotation gizmo events
    if (this.gizmoManager.gizmos.rotationGizmo) {
      this.gizmoManager.gizmos.rotationGizmo.onDragEndObservable.add(() => {
        updateCodeFromMesh()
      })
    }

    // Scale gizmo events
    if (this.gizmoManager.gizmos.scaleGizmo) {
      this.gizmoManager.gizmos.scaleGizmo.onDragEndObservable.add(() => {
        updateCodeFromMesh()
      })
    }
  }

  addAsset(assetCode: string, assetName: string, assetType: 'mesh' | 'light' | 'camera' | 'material') {
    if (!this.scene) return

    try {
      // Generate unique ID
      const id = `${assetName}_${Date.now()}`
      
      // Execute the asset code to create the object
      const func = new Function('BABYLON', 'scene', 'canvas', `
        ${assetCode}
        
        // Return the created object (try to find it by searching for new objects)
        const allMeshes = scene.meshes
        const allLights = scene.lights  
        const allCameras = scene.cameras
        
        // Return the last created object of the expected type
        if (typeof ${assetName.split(' ')[0].toLowerCase()} !== 'undefined') {
          return ${assetName.split(' ')[0].toLowerCase()}
        }
        
        // Fallback: return the newest object of the right type
        switch ('${assetType}') {
          case 'mesh':
            return allMeshes[allMeshes.length - 1]
          case 'light':
            return allLights[allLights.length - 1]
          case 'camera':
            return allCameras[allCameras.length - 1]
          default:
            return null
        }
      `)

      const babylonObject = func(BABYLON, this.scene, (window as any).canvas)
      
      if (babylonObject) {
        // Store the object
        const sceneObject: SceneObject = {
          id,
          name: assetName,
          type: assetType,
          babylonObject,
          code: this.generateObjectCode(babylonObject, assetName, assetType)
        }
        
        this.objects.set(id, sceneObject)
        this.updateCode()
        
        // Auto-select the new object if it's a mesh
        if (assetType === 'mesh' && this.gizmoManager) {
          setTimeout(() => {
            this.gizmoManager?.attachToMesh(babylonObject)
            this.setupGizmoEvents(babylonObject)
          }, 100)
        }
      }
    } catch (error) {
      console.error('Error adding asset:', error)
    }
  }

  private generateObjectCode(obj: any, name: string, type: string): string {
    if (!obj) return ''

    const safeName = name.toLowerCase().replace(/\s+/g, '')
    
    switch (type) {
      case 'mesh':
        return `// ${name}
const ${safeName} = ${this.getMeshCreationCode(obj)};
${safeName}.position = new BABYLON.Vector3(${obj.position.x.toFixed(2)}, ${obj.position.y.toFixed(2)}, ${obj.position.z.toFixed(2)});
${safeName}.rotation = new BABYLON.Vector3(${obj.rotation.x.toFixed(2)}, ${obj.rotation.y.toFixed(2)}, ${obj.rotation.z.toFixed(2)});
${safeName}.scaling = new BABYLON.Vector3(${obj.scaling.x.toFixed(2)}, ${obj.scaling.y.toFixed(2)}, ${obj.scaling.z.toFixed(2)});`

      case 'light':
        return `// ${name}
const ${safeName} = ${this.getLightCreationCode(obj)};
${safeName}.intensity = ${obj.intensity.toFixed(2)};`

      case 'camera':
        return `// ${name}
const ${safeName} = ${this.getCameraCreationCode(obj)};
${safeName}.setTarget(BABYLON.Vector3.Zero());`

      default:
        return `// ${name}\n// Code generation not implemented for type: ${type}`
    }
  }

  private getMeshCreationCode(mesh: any): string {
    const meshType = mesh.getClassName()
    
    // Try to determine the mesh type and generate appropriate creation code
    if (mesh.name.includes('box') || meshType === 'BoxMesh') {
      return `BABYLON.MeshBuilder.CreateBox("${mesh.name}", {size: 2}, scene)`
    } else if (mesh.name.includes('sphere') || meshType === 'SphereMesh') {
      return `BABYLON.MeshBuilder.CreateSphere("${mesh.name}", {diameter: 2}, scene)`
    } else if (mesh.name.includes('cylinder')) {
      return `BABYLON.MeshBuilder.CreateCylinder("${mesh.name}", {height: 3, diameter: 2}, scene)`
    } else if (mesh.name.includes('plane')) {
      return `BABYLON.MeshBuilder.CreatePlane("${mesh.name}", {size: 2}, scene)`
    } else if (mesh.name.includes('torus')) {
      return `BABYLON.MeshBuilder.CreateTorus("${mesh.name}", {diameter: 2, thickness: 0.5}, scene)`
    }
    
    return `BABYLON.MeshBuilder.CreateBox("${mesh.name}", {size: 2}, scene)`
  }

  private getLightCreationCode(light: any): string {
    const lightType = light.getClassName()
    
    switch (lightType) {
      case 'DirectionalLight':
        return `new BABYLON.DirectionalLight("${light.name}", new BABYLON.Vector3(-1, -1, -1), scene)`
      case 'PointLight':
        return `new BABYLON.PointLight("${light.name}", new BABYLON.Vector3(0, 5, 0), scene)`
      case 'SpotLight':
        return `new BABYLON.SpotLight("${light.name}", new BABYLON.Vector3(0, 5, 0), new BABYLON.Vector3(0, -1, 0), Math.PI / 3, 2, scene)`
      default:
        return `new BABYLON.HemisphericLight("${light.name}", new BABYLON.Vector3(0, 1, 0), scene)`
    }
  }

  private getCameraCreationCode(camera: any): string {
    const cameraType = camera.getClassName()
    
    switch (cameraType) {
      case 'ArcRotateCamera':
        return `new BABYLON.ArcRotateCamera("${camera.name}", -Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), scene)`
      case 'FreeCamera':
        return `new BABYLON.FreeCamera("${camera.name}", new BABYLON.Vector3(0, 5, -10), scene)`
      default:
        return `new BABYLON.FreeCamera("${camera.name}", new BABYLON.Vector3(0, 5, -10), scene)`
    }
  }

  private updateObjectCode(obj: SceneObject) {
    obj.code = this.generateObjectCode(obj.babylonObject, obj.name, obj.type)
    this.updateCode()
  }

  private updateCode() {
    if (!this.onCodeUpdate) return

    const allObjectCodes = Array.from(this.objects.values())
      .map(obj => obj.code)
      .join('\n\n')

    const fullCode = `// Babylon.js Scene
const createScene = function() {
    const scene = new BABYLON.Scene(engine);
    
    // Default camera and lighting
    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
    
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
    
    // Ground
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);
    
${allObjectCodes}
    
    return scene;
};`

    this.onCodeUpdate(fullCode)
  }

  clearAll() {
    this.objects.clear()
    if (this.gizmoManager) {
      this.gizmoManager.attachToMesh(null)
    }
  }

  dispose() {
    this.clearAll()
    if (this.gizmoManager) {
      this.gizmoManager.dispose()
      this.gizmoManager = null
    }
  }
}

// Hook for using scene manager
export function useSceneManager() {
  const sceneManagerRef = useRef<SceneManager | null>(null)

  const getSceneManager = useCallback(() => {
    if (!sceneManagerRef.current) {
      sceneManagerRef.current = new SceneManager()
    }
    return sceneManagerRef.current
  }, [])

  const dispose = useCallback(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.dispose()
      sceneManagerRef.current = null
    }
  }, [])

  return { getSceneManager, dispose }
}