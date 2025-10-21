import { useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  customMessage?: string;
}

export function useErrorHandler() {
  const { t } = useTranslation('errors');
  const defaultErrorMessage = t('general.operation_failed');

  const handleError = useCallback((
    error: unknown,
    defaultMessage?: string,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      customMessage
    } = options;

    // 提取错误信息
    const fallbackMessage = defaultMessage ?? defaultErrorMessage;
    let errorMessage = fallbackMessage;

    if (error instanceof Error) {
      errorMessage = error.message || fallbackMessage;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      const messageValue = (error as { message?: unknown }).message;
      if (typeof messageValue === 'string' && messageValue.trim().length > 0) {
        errorMessage = messageValue;
      }
    }

    // 使用自定义消息（如果提供）
    const displayMessage = customMessage || errorMessage;

    // 记录错误到控制台
    if (logError) {
      console.error('Error occurred:', {
        error,
        message: errorMessage,
        defaultMessage: fallbackMessage,
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
  }, [defaultErrorMessage]);

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
      
      const errorMessage = messages.error || defaultErrorMessage;
      toast.error(errorMessage);
      
      // 记录错误到控制台
      console.error('Promise failed:', {
        error,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }, [defaultErrorMessage]);

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,
    handlePromise
  };
}