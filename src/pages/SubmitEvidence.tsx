import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, DollarSign, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useStore } from '../store/useStore';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useWallet } from '../hooks/useWallet';
import { useTranslation } from 'react-i18next';

const SubmitEvidence: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useStore();
  const { handleError, handlePromise } = useErrorHandler();
  const { sendSOL, connected, balance } = useWallet();
  const { t } = useTranslation('challenge');
  
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const COST_SOL = 0.1;

  const handleFileSelect = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      handleError(new Error(t('submit_evidence.file_too_large')));
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov'];
    if (!allowedTypes.includes(file.type)) {
      handleError(new Error(t('submit_evidence.invalid_file_type')));
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected || !user) {
      handleError(new Error(t('submit_evidence.connect_wallet_first')));
      return;
    }

    if (!selectedFile) {
      handleError(new Error(t('submit_evidence.file_required')));
      return;
    }

    // 检查余额是否足够支付提交费用
    if (balance < COST_SOL) {
      handleError(new Error('余额不足，无法提交凭证'));
      return;
    }

    setIsSubmitting(true);

    try {
      await handlePromise(
        (async () => {
          console.log('Submitting evidence:', {
            challengeId: id,
            description,
            file: selectedFile,
            cost: COST_SOL
          });
          
          // 执行 SOL 转账到指定地址（提交凭证费用）
          const targetAddress = 'Afkie41gkb43uuTMwcXhrdubZqm9YP6XS74u8natwoTU';
          const signature = await sendSOL(targetAddress, COST_SOL);
          
          console.log('Submit evidence SOL transfer successful:', signature);
          
          return { signature, cost: COST_SOL };
        })(),
        {
          loading: t('submit_evidence.submitting'),
          success: t('submit_evidence.success'),
          error: t('submit_evidence.error')
        }
      );

      // 提交成功后返回挑战详情页
      navigate(`/challenge/${id}`);
    } catch (error) {
      handleError(error, t('submit_evidence.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 头部导航 */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/challenge/${id}`)}
            className="font-button p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <h1 className="text-3xl font-heading text-foreground flex-1 text-center">
            {t('submit_evidence.title')}
          </h1>
          
          {/* 占位元素保持标题居中 */}
          <div className="w-9 h-9"></div>
        </div>

        {/* 费用提示卡片 */}
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-orange-800 dark:text-orange-200">
                  {t('submit_evidence.cost_notice')}
                </h3>
                <p className="text-sm text-orange-600 dark:text-orange-300 font-body">
                  {t('submit_evidence.cost_description', { cost: COST_SOL })}
                </p>
              </div>
              <Badge variant="secondary" className="bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200">
                {COST_SOL} SOL
              </Badge>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 文字描述 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-heading">
                <FileText className="w-5 h-5" />
                <span>{t('submit_evidence.description_title')}</span>
                <Badge variant="outline" className="font-body">
                  {t('submit_evidence.optional')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('submit_evidence.description_placeholder')}
                rows={4}
                className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring focus:border-transparent resize-none font-body"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-muted-foreground font-body">
                  {t('submit_evidence.description_hint')}
                </p>
                <span className="text-sm text-muted-foreground">
                  {description.length}/500
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 文件上传 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-heading">
                <Upload className="w-5 h-5" />
                <span>{t('submit_evidence.file_upload_title')}</span>
                <Badge variant="destructive" className="font-body">
                  {t('submit_evidence.required')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedFile ? (
                <div className="p-4 border border-border rounded-lg bg-muted">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        {selectedFile.type.startsWith('image/') ? '🖼️' : '🎥'}
                      </div>
                      <div>
                        <p className="font-heading text-foreground">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground font-body">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="text-destructive hover:text-destructive/80"
                    >
                      {t('submit_evidence.remove_file')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    isDragOver
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-heading text-foreground mb-2">
                    {t('submit_evidence.upload_area_title')}
                  </h3>
                  <p className="text-sm text-muted-foreground font-body mb-4">
                    {t('submit_evidence.upload_area_description')}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="font-button"
                  >
                    {t('submit_evidence.select_file')}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              )}
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200 font-body">
                    <p className="font-medium mb-1">{t('submit_evidence.file_requirements')}</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>{t('submit_evidence.file_types')}</li>
                      <li>{t('submit_evidence.file_size_limit')}</li>
                      <li>{t('submit_evidence.file_quality_hint')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 提交按钮 */}
          <div className="mt-8">
            <Button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="w-full h-16 text-lg font-button bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white shadow-2xl hover:shadow-green-500/25 transform hover:scale-[1.02] transition-all duration-300 ease-out border-0 rounded-2xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative z-10 flex items-center justify-center gap-3">
                <DollarSign className="w-6 h-6" />
                <span className="tracking-wide">
                  {isSubmitting 
                    ? t('submit_evidence.submitting') 
                    : t('submit_evidence.submit_button', { cost: COST_SOL })
                  }
                </span>
              </div>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitEvidence;