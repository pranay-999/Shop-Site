const API_BASE_URL = "http://localhost:8080/api";

export async function getStocks() {
  try {
    const response = await fetch(`${API_BASE_URL}/stocks`);
    if (!response.ok) throw new Error("Failed to fetch stocks");
    return await response.json();
  } catch (error) {
    console.error("Error fetching stocks:", error);
    return [];
  }
}

export async function searchStocks(query: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/stocks/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("Failed to search stocks");
    return await response.json();
  } catch (error) {
    console.error("Error searching stocks:", error);
    return [];
  }
}

export async function createBill(billData: any) {
  try {
    const response = await fetch(`${API_BASE_URL}/bills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(billData),
    });
    if (!response.ok) throw new Error("Failed to create bill");
    return await response.json();
  } catch (error) {
    console.error("Error creating bill:", error);
    throw error;
  }
}

export async function checkBillNumberExists(billNumber: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/bills/exists/${billNumber}`);
    return await response.json();
  } catch (error) {
    console.error("Error checking bill number:", error);
    return false;
  }
}

export async function createStock(stockData: any) {
  try {
    const response = await fetch(`${API_BASE_URL}/stocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stockData),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} - ${errorText || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating stock:", error);
    throw error;
  }
}

export async function deleteStock(id: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/stocks/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to delete stock");
    return await response.json();
  } catch (error) {
    console.error("Error deleting stock:", error);
    throw error;
  }
}

export async function uploadStockExcel(file: File, categoryId: number) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("categoryId", String(categoryId));
    
    const response = await fetch(`${API_BASE_URL}/stocks/import`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Failed to upload stocks");
    return await response.json();
  } catch (error) {
    console.error("Error uploading stocks:", error);
    throw error;
  }
}