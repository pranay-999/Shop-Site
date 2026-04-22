"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from "react"
import { API_BASE } from "@/lib/api"

type CategoryContextType = {
  selectedCategory: string
  selectedCategoryId: number
  categories: Category[]
  setSelectedCategory: (category: string, categoryId: number) => void
}

type Category = {
  id: number
  categoryName: string
  categorySlug: string
  description: string
  icon: string
  colorCode: string
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined)

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [selectedCategory, setSelectedCategoryState] = useState("tiles")
  const [selectedCategoryId, setSelectedCategoryIdState] = useState(1)
  const [categories, setCategories] = useState<Category[]>([
    {
      id: 1,
      categoryName: "Tiles",
      categorySlug: "tiles",
      description: "Ceramic, Porcelain, Marble, Granite tiles",
      icon: "square",
      colorCode: "#3B82F6",
    },
    {
      id: 2,
      categoryName: "Electronics",
      categorySlug: "electronics",
      description: "Electronic items and appliances",
      icon: "lightbulb",
      colorCode: "#F59E0B",
    },
    {
      id: 3,
      categoryName: "Sanitary Ware",
      categorySlug: "sanitary-ware",
      description: "Bathroom fixtures and sanitary products",
      icon: "droplet",
      colorCode: "#10B981",
    },
    {
      id: 4,
      categoryName: "Faucets & Fixtures",
      categorySlug: "faucets",
      description: "Water faucets and bathroom fixtures",
      icon: "wrench",
      colorCode: "#8B5CF6",
    },
    {
      id: 5,
      categoryName: "Hardware",
      categorySlug: "hardware",
      description: "Building hardware and accessories",
      icon: "hammer",
      colorCode: "#EF4444",
    },
    {
      id: 6,
      categoryName: "Other",
      categorySlug: "other",
      description: "Miscellaneous products",
      icon: "cube",
      colorCode: "#6B7280",
    },
  ])

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selectedCategory")
      const savedId = localStorage.getItem("selectedCategoryId")
      if (saved && savedId) {
        setSelectedCategoryState(saved)
        setSelectedCategoryIdState(Number(savedId))
      }
    }
  }, [])

  // Sync categories from backend (falls back to hardcoded list if backend is down)
  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setCategories(data)
      })
      .catch(() => {}) // silent fail — hardcoded fallback stays active
  }, [])

  const handleSetCategory = (category: string, categoryId: number) => {
    setSelectedCategoryState(category)
    setSelectedCategoryIdState(categoryId)
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedCategory", category)
      localStorage.setItem("selectedCategoryId", String(categoryId))
    }
  }

  const value = useMemo(
    () => ({
      selectedCategory,
      selectedCategoryId,
      categories,
      setSelectedCategory: handleSetCategory,
    }),
    [selectedCategory, selectedCategoryId, categories]
  )

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategory() {
  const context = useContext(CategoryContext)
  if (!context) {
    throw new Error("useCategory must be used within CategoryProvider")
  }
  return context
}
