import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Image, Grid3X3, ArrowLeft } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from 'react-i18next';

// 默认图片
import defaultImage1 from '../assets/1.jpg';
import defaultImage2 from '../assets/2.jpg';
import defaultImage3 from '../assets/3.jpg';

interface ChallengeForm {
  title: string;
  description: string;
  durationType: 'hours' | 'days';
  durationValue: number;
  prizePool: number;
  category: string;
  image: File | string | null;
  allowRandomStop: boolean;
}

const CreateChallenge: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const { handleError, handlePromise } = useErrorHandler();
  const { t } = useTranslation('challenge');
  
  const [form, setForm] = useState<ChallengeForm>({
    title: '',
    description: '',
    durationType: 'hours',
    durationValue: 24,
    prizePool: 0.3,
    category: 'creative',
    image: null,
    allowRandomStop: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDefaultImages, setShowDefaultImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: 'fitness', name: '健身运动', icon: '💪' },
    { id: 'learning', name: '学习成长', icon: '📚' },
    { id: 'creative', name: '创意挑战', icon: '🎨' },
    { id: 'lifestyle', name: '生活方式', icon: '🌱' },
    { id: 'social', name: '社交互动', icon: '👥' },
    { id: 'other', name: '其他', icon: '🎯' }
  ];

  const defaultImages = [
    { id: 'default1', name: '默认图片 1', url: defaultImage1 },
    { id: 'default2', name: '默认图片 2', url: defaultImage2 },
    { id: 'default3', name: '默认图片 3', url: defaultImage3 }
  ];

  const handleInputChange = <K extends keyof ChallengeForm>(field: K, value: ChallengeForm[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setForm(prev => ({ ...prev, image: file }));
      setShowDefaultImages(false);
    }
  };

  const handleDefaultImageSelect = (imageUrl: string) => {
    setImagePreview(imageUrl);
    setForm(prev => ({ ...prev, image: imageUrl }));
    setShowDefaultImages(false);
  };

  const handleImageRemove = () => {
    setImagePreview(null);
    setForm(prev => ({ ...prev, image: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      handleImageUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      handleError(new Error('请先连接钱包'));
      return;
    }

    if (!form.image) {
      handleError(new Error('请选择挑战图片'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      await handlePromise(
        (async () => {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          console.log('创建挑战:', form);
          return 'success';
        })(),
        {
          loading: '正在创建挑战...',
          success: '挑战创建成功！',
          error: '创建挑战失败，请重试'
        }
      );
      
      navigate('/');
    } catch (error) {
      handleError(error, '创建挑战失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* 返回按钮和标题在同一行 */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="font-button p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <h1 className="text-3xl font-heading text-foreground flex-1 text-center">
            {t('create.title')}
          </h1>
          
          {/* 占位元素保持标题居中 */}
          <div className="w-9 h-9"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-heading text-foreground mb-2">
              {t('create.form.challenge_title')} <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={form.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder={t('create.form.challenge_title_placeholder')}
              className="w-full font-body text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-heading text-foreground mb-2">
              {t('create.form.description')} <span className="text-destructive">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={t('create.form.description_placeholder')}
              rows={4}
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring focus:border-transparent resize-none font-body"
            />
          </div>

          <div>
            <label className="block text-sm font-heading text-foreground mb-2">
              {t('create.form.image')} <span className="text-destructive">*</span>
            </label>
            
            {imagePreview && (
              <div className="mb-4">
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt={t('create.form.image_preview')}
                    className="w-32 h-32 object-cover rounded-lg border-2 border-border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleImageRemove}
                    className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isDragOver
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-muted-foreground'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-3">
                <Image className="w-8 h-8 mx-auto text-muted-foreground" />
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-2 font-button text-foreground border-border hover:bg-muted"
                  >
                    <Upload className="w-4 h-4 mr-2 text-foreground" />
                    {t('create.form.upload_image')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDefaultImages(!showDefaultImages)}
                    className="text-primary ml-2 font-button hover:bg-muted"
                  >
                    <Grid3X3 className="w-4 h-4 mr-1" />
                    {t('create.form.default_gallery')}
                  </Button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {showDefaultImages && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-3 gap-3">
                  {defaultImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative cursor-pointer group"
                      onClick={() => handleDefaultImageSelect(img.url)}
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-24 object-cover rounded-lg border-2 border-border group-hover:border-primary transition-colors"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                        <span className="text-white text-sm font-button opacity-0 group-hover:opacity-100">
                          {t('create.form.select')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDefaultImages(false)}
                  className="mt-3 w-full font-button"
                >
                  {t('create.form.cancel_selection')}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-4">
                <label className="text-sm font-heading text-foreground whitespace-nowrap">
                  {t('create.form.category')}
                </label>
                <select
                    value={form.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="flex-1 px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring focus:border-transparent font-body"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {t(`create.categories.${category.id}`)}
                      </option>
                    ))}
                  </select>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-4">
                <label className="text-sm font-heading text-foreground whitespace-nowrap">
                  {t('create.form.duration')}
                </label>
                <div className="flex space-x-2 flex-1">
                  <Input
                    type="number"
                    value={form.durationValue}
                    onChange={(e) => handleInputChange('durationValue', parseInt(e.target.value))}
                    min="1"
                    max={form.durationType === 'days' ? 7 : 168}
                    className="flex-1 font-mono text-foreground"
                  />
                  <select
                    value={form.durationType}
                    onChange={(e) => handleInputChange('durationType', e.target.value as 'hours' | 'days')}
                    className="px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring focus:border-transparent font-body"
                  >
                    <option value="hours">{t('create.form.hours')}</option>
                    <option value="days">{t('create.form.days')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-4">
                <label className="text-sm font-heading text-foreground whitespace-nowrap">
                  {t('create.form.random_stop')}
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('allowRandomStop', !form.allowRandomStop)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                      form.allowRandomStop 
                        ? 'bg-primary' 
                        : 'bg-muted-foreground/20 dark:bg-muted-foreground/30'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        form.allowRandomStop ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-muted-foreground font-body">
                    {form.allowRandomStop ? t('create.form.random_stop_enabled') : t('create.form.random_stop_disabled')}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-body ml-[120px]">
                {t('create.form.random_stop_hint')}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-heading text-foreground whitespace-nowrap">
                {t('create.form.prize_pool')}
              </label>
              <div className="flex-1 max-w-md">
                <Input
                  type="number"
                  value={form.prizePool}
                  onChange={(e) => handleInputChange('prizePool', parseFloat(e.target.value))}
                  min="0.05"
                  step="0.01"
                  placeholder={t('create.form.prize_pool_placeholder')}
                  className="font-mono text-foreground"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1 font-body">
              {t('create.form.prize_pool_hint')}
            </p>
          </div>

          <div className="mt-8 mb-8">
            <Button
              type="submit"
              disabled={isSubmitting || !form.title.trim() || !form.description.trim() || !form.image}
              className="w-full h-16 text-lg font-button bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white shadow-2xl hover:shadow-purple-500/25 transform hover:scale-[1.02] transition-all duration-300 ease-out border-0 rounded-2xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative z-10 flex items-center justify-center gap-3">
                <span className="tracking-wide">
                  {isSubmitting ? t('create.form.creating') : t('create.form.launch_challenge')}
                </span>
              </div>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChallenge;