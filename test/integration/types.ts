export interface UploadFileResponse {
  uploadFile: {
    fileId: string;
    uploadUrl: string;
    status: string;
    error?: string;
  };
}

export interface GetUploadStatusResponse {
  getUploadStatus: {
    fileId: string;
    status: string;
    progress: number;
    tableName: string;
  };
}

export interface ProcessQueryResponse {
  processQuery: {
    queryId: string;
    status: string;
    results?: {
      columns: string[];
      rows: any[][];
    };
    error?: string;
  };
}

export interface ChatMessage {
  messageId: string;
  userId: string;
  question: string;
  answer?: string;
  timestamp: string;
  status: string;
}

export interface GetChatHistoryResponse {
  getChatHistory: ChatMessage[];
} 