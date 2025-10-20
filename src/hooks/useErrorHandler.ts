import { useCallback } from 'react';
import { toast } from 'sonner';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  customMessage?: string;
}

export function useErrorHandler() {
  const handleError = useCallback((
    error: unknown, 
    defaultMessage: string = '操作失败',
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      customMessage
    } = options;

    // 提取错误信息
    let errorMessage = defaultMessage;
    
    if (error instanceof Error) {
      errorMessage = error.message || defaultMessage;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error as any).message || defaultMessage;
    }

    // 使用自定义消息（如果提供）
    const displayMessage = customMessage || errorMessage;

    // 记录错误到控制台
    if (logError) {
      console.error('Error occurred:', {
        error,
        message: errorMessage,
        defaultMessage,
        timestamp: new Date().toISOString()
      });
    }

    // 显示错误提示
    if (showToast) {
      toast.error(displayMessage);
    }

    return {
      message: errorMessage,
      displayMessage
    };
  }, []);

  const handleSuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  const handleWarning = useCallback((message: string) => {
    toast.warning(message);
  }, []);

  const handleInfo = useCallback((message: string) => {
    toast.info(message);
  }, []);

  const handlePromise = useCallback(async <T>(
    promise: Promise<T>,
    messages: {
      loading?: string;
      success?: string;
      error?: string;
    }
  ): Promise<T> => {
    const toastId = messages.loading ? toast.loading(messages.loading) : null;
    
    try {
      const result = await promise;
      
      if (toastId) {
        toast.dismiss(toastId);
      }
      
      if (messages.success) {
        toast.success(messages.success);
      }
      
      return result;
    } catch (error) {
      if (toastId) {
        toast.dismiss(toastId);
      }
      
      const errorMessage = messages.error || '操作失败';
      toast.error(errorMessage);
      
      // 记录错误到控制台
      console.error('Promise failed:', {
        error,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }, []);

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,
    handlePromise
  };
}