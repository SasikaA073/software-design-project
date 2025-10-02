// API service layer for backend communication
// This provides a modular architecture for connecting to backend services

const API_BASE_URL = "/api";

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface TransformerData {
  id?: string;
  transformerNo: string;
  poleNo: string;
  region: string;
  type: "Distribution" | "Bulk";
  capacity: number;
  noOfFeeders: number;
  locationDetails: string;
  status: "Operational" | "Maintenance" | "Offline";
  lastInspected?: string;
  sunnyBaselineImageUrl?: string;
  cloudyBaselineImageUrl?: string;
  rainyBaselineImageUrl?: string;
}

export interface InspectionData {
  id?: string;
  inspectionNo: string;
  transformer?:TransformerData;
  transformerId: string;
  transformerNo: string;
  inspectedDate: string;
  maintenanceDate?: string;
  status: "In Progress" | "Pending" | "Completed";
  inspectedBy: string;
  weatherCondition?: "Sunny" | "Cloudy" | "Rainy";
  imageUrl?: string;
}

export interface ThermalImageData {
  id?: string;
  inspectionId: string;
  imageType: "Baseline" | "Maintenance";
  imageUrl: string;
  uploadedAt: string;
  temperatureReading?: number;
  anomalyDetected?: boolean;
  weatherCondition?: "Sunny" | "Cloudy" | "Rainy";
}

export interface AlertData {
    id?: string;
    transformer_id: string;
    alert_type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    is_read?: boolean;
}

class ApiService {
  // Transformer API methods
  async getTransformers(): Promise<ApiResponse<TransformerData[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/transformers`);
      if (!response.ok) {
        throw new Error("Failed to fetch transformers");
      }
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { data: [], success: false, message: error.message };
    }
  }

  async addTransformer(transformer: TransformerData): Promise<ApiResponse<TransformerData>> {
    try {
      const response = await fetch(`${API_BASE_URL}/transformers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformer),
      });
      if (!response.ok) {
        throw new Error("Failed to add transformer");
      }
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { data: null as any, success: false, message: error.message };
    }
  }

  async updateTransformer(id: string, transformer: Partial<TransformerData>): Promise<ApiResponse<TransformerData>> {
    try {
      const response = await fetch(`${API_BASE_URL}/transformers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformer),
      });
      if (!response.ok) {
        throw new Error("Failed to update transformer");
      }
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { data: null as any, success: false, message: error.message };
    }
  }

  async deleteTransformer(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${API_BASE_URL}/transformers/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete transformer");
      }
      return { data: null, success: true };
    } catch (error: any) {
      return { data: null, success: false, message: error.message };
    }
  }

  async uploadBaselineImage(transformerId: string, weatherCondition: string, file: File): Promise<ApiResponse<TransformerData>> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("weatherCondition", weatherCondition);

      const response = await fetch(`${API_BASE_URL}/transformers/${transformerId}/baseline-image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload baseline image");
      }

      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { data: null as any, success: false, message: error.message };
    }
  }

  async getBaselineImageUrl(transformerId: string, weatherCondition: string): Promise<ApiResponse<string>> {
    try {
      const response = await fetch(`${API_BASE_URL}/transformers/${transformerId}/baseline-image?weatherCondition=${weatherCondition}`);
      if (!response.ok) {
        throw new Error("Failed to fetch baseline image URL");
      }
      const relativeUrl = await response.text();
      // Construct full URL if the response is a relative path
      const fullUrl = relativeUrl && relativeUrl.startsWith('/') 
        ? `${API_BASE_URL}${relativeUrl}` 
        : relativeUrl;
      return { data: fullUrl, success: true };
    } catch (error: any) {
      return { data: "", success: false, message: error.message };
    }
  }

  // Inspection API methods
  async getInspections(transformerId?: string): Promise<ApiResponse<InspectionData[]>> {
    try {
      const url = transformerId
        ? `${API_BASE_URL}/inspections?transformerId=${transformerId}`
        : `${API_BASE_URL}/inspections`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch inspections");
      }
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { data: [], success: false, message: error.message };
    }
  }

  async getInspection(id: string): Promise<ApiResponse<InspectionData>> {
    try {
      const response = await fetch(`${API_BASE_URL}/inspections/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch inspection");
      }
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { data: null as any, success: false, message: error.message };
    }
  }

  async addInspection(inspection: Omit<InspectionData, "id" | "transformerNo">): Promise<ApiResponse<InspectionData>> {
    try {
      const response = await fetch(`${API_BASE_URL}/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inspection),
      });
      if (!response.ok) {
        throw new Error("Failed to add inspection");
      }
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { data: null as any, success: false, message: error.message };
    }
  }

  async updateInspection(id: string, inspection: Partial<InspectionData>): Promise<ApiResponse<InspectionData>> {
    try {
      const response = await fetch(`${API_BASE_URL}/inspections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inspection),
      });
      if (!response.ok) {
        throw new Error("Failed to update inspection");
      }
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { data: null as any, success: false, message: error.message };
    }
  }

  async deleteInspection(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${API_BASE_URL}/inspections/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete inspection");
      }
      return { data: null, success: true };
    } catch (error: any) {
      return { data: null, success: false, message: error.message };
    }
  }

  // Thermal Image API methods
  async uploadThermalImage(
    inspectionId: string,
    file: File,
    imageType: "Baseline" | "Maintenance",
    weatherCondition?: string
  ): Promise<ApiResponse<ThermalImageData>> {
    const formData = new FormData()
    formData.append("file", file)
    
    const imageData: any = { 
      imageType, 
      anomalyDetected: false, 
      temperatureReading: 0 
    };
    
    // Add weather condition for maintenance images
    if (imageType === "Maintenance" && weatherCondition) {
      imageData.weatherCondition = weatherCondition;
    }
    
    formData.append(
      "image",
      new Blob([JSON.stringify(imageData)], {
        type: "application/json",
      })
    )

    const res = await fetch(`${API_BASE_URL}/thermal-images/upload?inspectionId=${inspectionId}`, {
      method: "POST",
      body: formData,
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || "Failed to upload thermal image")
    }

    const data = await res.json()
    return { data, success: true }
  }

  async getThermalImages(inspectionId: string): Promise<ApiResponse<ThermalImageData[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/thermal-images?inspectionId=${inspectionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch thermal images");
      }
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { data: [], success: false, message: error.message };
    }
  }

  async getBaselineImage(inspectionId: string): Promise<ApiResponse<ThermalImageData | null>> {
    try {
      const response = await fetch(`${API_BASE_URL}/thermal-images?inspectionId=${inspectionId}&imageType=Baseline`)
      if (!response.ok) throw new Error("Failed to fetch baseline image")
      const data = await response.json()
      return { data: data[0] || null, success: true }
    } catch (error: any) {
      return { data: null, success: false, message: error.message }
    }
  }

  async getMaintenanceImages(inspectionId: string): Promise<ApiResponse<ThermalImageData[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/thermal-images?inspectionId=${inspectionId}&imageType=Maintenance`)
      if (!response.ok) throw new Error("Failed to fetch maintenance images")
      const data = await response.json()
      return { data, success: true }
    } catch (error: any) {
      return { data: [], success: false, message: error.message }
    }
  }



  // Alert API methods
  async getAlerts(transformerId?: string): Promise<ApiResponse<AlertData[]>> {
    try {
        const url = transformerId
        ? `${API_BASE_URL}/alerts?transformerId=${transformerId}`
        : `${API_BASE_URL}/alerts`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch alerts");
      }
      const data = await response.json();
      return { data, success: true };
    } catch (error: any) {
      return { data: [], success: false, message: error.message };
    }
  }
}

export const api = new ApiService()
