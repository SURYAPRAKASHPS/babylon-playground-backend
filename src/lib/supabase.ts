import { createClient } from '@supabase/supabase-js'

// These would typically come from environment variables
// For demo purposes, we'll create a simple interface
export interface PlaygroundScene {
  id?: string
  name: string
  code: string
  language: 'javascript' | 'typescript'
  created_at?: string
  updated_at?: string
}

// Simple localStorage-based storage for demo
// In a real app, this would use Supabase
export class PlaygroundStorage {
  private static readonly STORAGE_KEY = 'babylon_playground_scenes'

  static async saveScene(scene: PlaygroundScene): Promise<PlaygroundScene> {
    const scenes = this.getScenes()
    const id = scene.id || `scene_${Date.now()}`
    const savedScene = {
      ...scene,
      id,
      updated_at: new Date().toISOString(),
      created_at: scene.created_at || new Date().toISOString()
    }
    
    const existingIndex = scenes.findIndex(s => s.id === id)
    if (existingIndex >= 0) {
      scenes[existingIndex] = savedScene
    } else {
      scenes.push(savedScene)
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scenes))
    return savedScene
  }

  static async loadScene(id: string): Promise<PlaygroundScene | null> {
    const scenes = this.getScenes()
    return scenes.find(scene => scene.id === id) || null
  }

  static getScenes(): PlaygroundScene[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static async deleteScene(id: string): Promise<void> {
    const scenes = this.getScenes().filter(scene => scene.id !== id)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scenes))
  }
}