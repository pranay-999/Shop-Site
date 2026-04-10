"use client"

import React, { createContext, useContext, useMemo, useState } from "react"

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

const DEFAULT_CATEGORY = { slug: "tiles", id: 1 }

const DEFAULT_CATEGORIES: Category[] = [
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
]

function getInitialCategory() {
  if (typeof window === "undefined") {
    return DEFAULT_CATEGORY
  }

  const saved = localStorage.getItem("selectedCategory")
  const savedId = localStorage.getItem("selectedCategoryId")

  if (!saved || !savedId) {
    return DEFAULT_CATEGORY
  }

  return {
    slug: saved,
    id: Number(savedId),
  }
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined)

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [selectedCategory, setSelectedCategoryState] = useState(
    () => getInitialCategory().slug
  )
  const [selectedCategoryId, setSelectedCategoryIdState] = useState(
    () => getInitialCategory().id
  )

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
      categories: DEFAULT_CATEGORIES,
      setSelectedCategory: handleSetCategory,
    }),
    [selectedCategory, selectedCategoryId]
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
