"use client"

import { useCategory } from "@/context/CategoryContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function CategorySelector() {
  const { selectedCategory, categories, setSelectedCategory } = useCategory()

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Category:</span>
      <Select value={selectedCategory} onValueChange={(slug) => {
        const category = categories.find(c => c.categorySlug === slug)
        if (category) {
          setSelectedCategory(slug, category.id)
        }
      }}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.categorySlug}>
              {category.categoryName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
