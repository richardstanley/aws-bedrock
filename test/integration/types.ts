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
    tableName?: string;
    error?: string;
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
  getChatHistory: Array<{
    messageId: string;
    userId: string;
    question: string;
    answer: string;
    timestamp: number;
    status: string;
  }>;
}

export interface SavedResult {
  resultId: string;
  userId: string;
  query: string;
  result: string;
  createdAt: string;
  expiresAt?: string;
}

export interface SavedResultConnection {
  items: SavedResult[];
  nextToken?: string;
}

export interface SaveQueryResultResponse {
  saveQueryResult: SavedResult;
}

export interface GetSavedResultsResponse {
  getSavedResults: SavedResultConnection;
}

export interface DeleteSavedResultResponse {
  deleteSavedResult: boolean;
} 