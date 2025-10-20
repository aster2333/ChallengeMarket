import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  DollarSign, 
  Users,
  Camera,
  CheckCircle,
  XCircle,
  Share,
  MessageCircle,
  TrendingUp,
  Trophy,
  Star
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from 'react-i18next';
import i18n from '../lib/i18n';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import image1 from '../assets/1.jpg';
import image2 from '../assets/2.jpg';
import image3 from '../assets/3.jpg';

interface Challenge {
  id: string;
  title: string;
  description: string;
  creator: string;
  prizePool: number;
  maxParticipants: number;
  currentParticipants: number;
  endTime: Date;
  status: 'active' | 'voting' | 'completed';
  category: string;
  image: string;
  participants: Participant[];
  bets: Bet[];
}

interface Participant {
  id: string;
  address: string;
  nickname: string;
  joinTime: Date;
  evidence?: string;
  evidenceType?: 'image' | 'video' | 'text';
  status: 'participating' | 'submitted' | 'success' | 'failed';
}

interface Bet {
  id: string;
  bettor: string;
  amount: number;
  side: 'support' | 'against';
  timestamp: Date;
}

interface PriceData {
  time: string;
  yes: number;
  no: number;
}

interface RelatedChallenge {
  id: string;
  title: string;
  image: string;
  prizePool: number;
  participants: number;
  category: string;
}

interface Comment {
  id: string;
  user: string;
  content: string;
  timestamp: Date;
  likes: number;
}

interface Holder {
  id: string;
  address: string;
  nickname: string;
  yesShares: number;
  noShares: number;
  totalValue: number;
}

interface Activity {
  id: string;
  type: 'join' | 'bet' | 'submit' | 'comment';
  user: string;
  description: string;
  timestamp: Date;
}

const ChallengeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useStore();
  const { handleError, handleSuccess, handlePromise } = useErrorHandler();
  const { t } = useTranslation('challenge');
  const detail = (key: string) => t(`detail.${key}`);
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [relatedChallenges, setRelatedChallenges] = useState<RelatedChallenge[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [holders, setHolders] = useState<Holder[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newComment, setNewComment] = useState('');

  // 生成模拟价格数据（单调上涨对数曲线）
  const generatePriceData = (locale: string): PriceData[] => {
    const data: PriceData[] = [];
    const baseTime = Date.now() - 24 * 60 * 60 * 1000; // 24小时前
    
    for (let i = 0; i < 24; i++) {
      const time = new Date(baseTime + i * 60 * 60 * 1000);
      // 使用对数函数生成单调上涨的价格
      const yesPrice = 0.1 + Math.log(i + 1) * 0.15 + Math.random() * 0.05;
      const noPrice = 0.05 + Math.log(i + 1) * 0.08 + Math.random() * 0.03;
      
      data.push({
        time: time.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
        yes: Math.round(yesPrice * 100) / 100,
        no: Math.round(noPrice * 100) / 100
      });
    }
    
    return data;
  };

  // 模拟数据加载
  useEffect(() => {
    const loadChallenge = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 根据当前语言生成模拟数据
      const currentLanguage = i18n.language || i18n.resolvedLanguage || 'zh';
      const isEnglish = currentLanguage.startsWith('en');
      
      // 调试信息
      console.log('Current language:', currentLanguage, 'isEnglish:', isEnglish);
      
      const locale = isEnglish ? 'en-US' : 'zh-CN';

      const mockChallenge: Challenge = {
        id: id || '1',
        title: isEnglish ? '30-Day 5KM Daily Running Challenge' : '30天每日跑步5公里挑战',
        description: isEnglish 
          ? 'Run at least 5 kilometers every day for 30 consecutive days. You need to provide running record screenshots or GPS tracks as evidence. Daily running evidence must be submitted before 12 PM each day.'
          : '连续30天每天跑步至少5公里，需要提供跑步记录截图或GPS轨迹作为证据。每天需要在晚上12点前提交当日跑步证据。',
        creator: '7xKXtg2CW...9rKhTYXN',
        prizePool: 2.5,
        maxParticipants: 10,
        currentParticipants: 7,
        endTime: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        status: 'active',
        category: 'fitness',
        image: image1,
        participants: [
          {
            id: '1',
            address: '7xKXtg2CW...9rKhTYXN',
            nickname: 'Runner001',
            joinTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            status: 'participating'
          },
          {
            id: '2',
            address: '8yLYug3DX...8sLiUZYO',
            nickname: 'FitnessKing',
            joinTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            evidence: 'https://example.com/evidence.jpg',
            evidenceType: 'image',
            status: 'submitted'
          }
        ],
        bets: [
          {
            id: '1',
            bettor: '9zMZvh4EY...7tMjVAZP',
            amount: 0.5,
            side: 'support',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
          },
          {
            id: '2',
            bettor: '6wNWxi5FZ...6uNkWBYQ',
            amount: 0.3,
            side: 'against',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
          }
        ]
      };

      // 生成相关挑战数据
      const mockRelatedChallenges: RelatedChallenge[] = [
        {
          id: '2',
          title: isEnglish ? '21-Day Early Rising Challenge' : '21天早起挑战',
          image: image2,
          prizePool: 1.8,
          participants: 15,
          category: 'lifestyle'
        },
        {
          id: '3',
          title: isEnglish ? '7-Day Healthy Eating Challenge' : '7天健康饮食挑战',
          image: image3,
          prizePool: 3.2,
          participants: 8,
          category: 'health'
        },
        {
          id: '4',
          title: isEnglish ? '30-Day Reading Challenge' : '30天阅读挑战',
          image: image1,
          prizePool: 2.1,
          participants: 12,
          category: 'education'
        }
      ];

      // 生成评论数据
      const mockComments: Comment[] = [
        {
          id: '1',
          user: 'FitnessLover',
          content: isEnglish 
            ? 'This challenge is very interesting, I have persisted for 5 days!'
            : '这个挑战很有意思，我已经坚持了5天了！',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          likes: 12
        },
        {
          id: '2',
          user: 'RunnerPro',
          content: isEnglish
            ? '5 kilometers daily is indeed challenging, but it\'s worth it!'
            : '每天5公里确实有挑战性，但是很值得！',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          likes: 8
        }
      ];

      // 生成持有者数据
      const mockHolders: Holder[] = [
        {
          id: '1',
          address: '7xKXtg2CW...9rKhTYXN',
          nickname: 'TopTrader',
          yesShares: 150,
          noShares: 0,
          totalValue: 0.75
        },
        {
          id: '2',
          address: '8yLYug3DX...8sLiUZYO',
          nickname: 'SmartBetter',
          yesShares: 80,
          noShares: 120,
          totalValue: 1.2
        }
      ];

      // 生成动态数据
      const mockActivities: Activity[] = [
        {
          id: '1',
          type: 'join',
          user: 'NewRunner',
          description: isEnglish ? 'joined the challenge' : '加入了挑战',
          timestamp: new Date(Date.now() - 30 * 60 * 1000)
        },
        {
          id: '2',
          type: 'bet',
          user: 'BetMaster',
          description: isEnglish 
            ? 'bet 0.5 SOL supporting success'
            : '下注 0.5 SOL 支持成功',
          timestamp: new Date(Date.now() - 60 * 60 * 1000)
        },
        {
          id: '3',
          type: 'submit',
          user: 'Runner001',
          description: isEnglish
            ? 'submitted day 5 running evidence'
            : '提交了第5天的跑步证据',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      ];
      
      setChallenge(mockChallenge);
      setPriceData(generatePriceData(locale));
      setRelatedChallenges(mockRelatedChallenges);
      setComments(mockComments);
      setHolders(mockHolders);
      setActivities(mockActivities);
      setLoading(false);
    };

    loadChallenge();
  }, [id, i18n.language]);

  const handleJoinChallenge = async () => {
    if (!user) {
      handleError(new Error(detail('connect_wallet_first')));
      return;
    }

    try {
      await handlePromise(
        new Promise(async (resolve) => {
          console.log('Joining challenge:', id);
          await new Promise(r => setTimeout(r, 1000));
          resolve('success');
        }),
        {
          loading: detail('joining_challenge'),
          success: detail('join_success'),
          error: detail('join_failed')
        }
      );
    } catch (error) {
      handleError(error, detail('join_failed'));
    }
  };

  const handleBankroll = async () => {
    if (!user) {
      handleError(new Error(detail('connect_wallet_first')));
      return;
    }

    try {
      await handlePromise(
        new Promise(async (resolve) => {
          console.log('Bankrolling challenge:', id);
          await new Promise(r => setTimeout(r, 1000));
          resolve('success');
        }),
        {
          loading: detail('bankrolling'),
          success: detail('bankroll_success'),
          error: detail('bankroll_failed')
        }
      );
    } catch (error) {
      handleError(error, detail('bankroll_failed'));
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      user: user?.address.slice(0, 8) + '...' || 'Anonymous',
      content: newComment,
      timestamp: new Date(),
      likes: 0
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-16 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-background pt-16 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground">{detail('challenge_not_exist')}</h2>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              {detail('return_home')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mr-4 font-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {detail('back')}
          </Button>
        </div>

        {/* 挑战图片和名称 */}
        <div className="mb-6">
          <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden mb-4">
            <img
              src={challenge.image}
              alt={challenge.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <Badge variant="secondary" className="mb-2 font-body">
                {challenge.category}
              </Badge>
              <h1 className="text-2xl md:text-3xl font-heading text-white">{challenge.title}</h1>
            </div>
          </div>
        </div>

        {/* 发布者信息和抢庄按钮 */}
        <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-xl border">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-button text-lg">
              {challenge.creator.slice(0, 2)}
            </div>
            <div>
              <div className="font-heading text-foreground">{detail('publisher')}</div>
              <div className="text-sm text-muted-foreground font-mono">
                {challenge.creator.slice(0, 8)}...{challenge.creator.slice(-6)}
              </div>
            </div>
          </div>
          <Button
            onClick={handleBankroll}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-button px-6 py-2"
          >
            <Trophy className="w-4 h-4 mr-2" />
            {detail('bankroll')}
          </Button>
        </div>

        {/* 价格变化图表 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">{detail('yes')}/{detail('no')} {detail('price_chart')}</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceData}>
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="yes"
                    stroke="url(#yesGradient)"
                    strokeWidth={3}
                    dot={false}
                    name={detail('yes')}
                  />
                  <Line
                    type="monotone"
                    dataKey="no"
                    stroke="url(#noGradient)"
                    strokeWidth={3}
                    dot={false}
                    name={detail('no')}
                  />
                  <defs>
                    <linearGradient id="yesGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                    <linearGradient id="noGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#f87171" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-8 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-400 rounded-full"></div>
                <span className="text-sm font-body text-muted-foreground">{detail('yes')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-red-400 rounded-full"></div>
                <span className="text-sm font-body text-muted-foreground">{detail('no')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 接收挑战按钮 */}
        <div className="mb-6">
          <Button
            onClick={handleJoinChallenge}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-button py-4 text-lg"
            disabled={challenge.currentParticipants >= challenge.maxParticipants}
          >
            <Users className="w-5 h-5 mr-2" />
            {challenge.currentParticipants >= challenge.maxParticipants ? detail('challenge_full_text') : detail('accept_challenge')}
          </Button>
        </div>

        {/* 相关挑战 */}
        <div className="mb-6">
          <h2 className="text-xl font-heading text-foreground mb-4">{detail('related_challenges')}</h2>
          <div className="space-y-3">
            {relatedChallenges.map(relatedChallenge => (
              <Card key={relatedChallenge.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={relatedChallenge.image}
                      alt={relatedChallenge.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-heading text-foreground">{relatedChallenge.title}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-muted-foreground font-body">
                          <DollarSign className="w-4 h-4 inline mr-1" />
                          {relatedChallenge.prizePool} SOL
                        </span>
                        <span className="text-sm text-muted-foreground font-body">
                          <Users className="w-4 h-4 inline mr-1" />
                          {relatedChallenge.participants}{detail('people')}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-body">
                      {relatedChallenge.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 评论/持有者/动态标签页 */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="comments" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="comments" className="font-button">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {detail('comments')}
                </TabsTrigger>
                <TabsTrigger value="holders" className="font-button">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {detail('holders')}
                </TabsTrigger>
                <TabsTrigger value="activities" className="font-button">
                  <Star className="w-4 h-4 mr-2" />
                  {detail('activities')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="comments" className="mt-6">
                <div className="space-y-4">
                  {/* 添加评论 */}
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-sm font-button">
                      U
                    </div>
                    <div className="flex-1">
                      <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={detail('write_comment')}
                        className="mb-2"
                      />
                      <Button
                        onClick={handleAddComment}
                        size="sm"
                        disabled={!newComment.trim()}
                        className="font-button"
                      >
                        {detail('post_comment')}
                      </Button>
                    </div>
                  </div>

                  {/* 评论列表 */}
                  {comments.map(comment => (
                    <div key={comment.id} className="flex space-x-3 p-3 bg-muted rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white text-sm font-button">
                        {comment.user.slice(0, 1)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-heading text-sm">{comment.user}</span>
                          <span className="text-xs text-muted-foreground">
                            {comment.timestamp.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-foreground font-body">{comment.content}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Button variant="ghost" size="sm" className="text-xs font-button">
                            👍 {comment.likes}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="holders" className="mt-6">
                <div className="space-y-3">
                  {holders.map(holder => (
                    <div key={holder.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-button">
                          {holder.nickname.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-heading">{holder.nickname}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {holder.address.slice(0, 8)}...{holder.address.slice(-6)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono">
                          <span className="text-green-600">{detail('yes')}: {holder.yesShares}</span>
                          <span className="text-red-600 ml-2">{detail('no')}: {holder.noShares}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {detail('total_value')}: {holder.totalValue} SOL
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="activities" className="mt-6">
                <div className="space-y-3">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white text-sm">
                        {activity.type === 'join' && '🚀'}
                        {activity.type === 'bet' && '💰'}
                        {activity.type === 'submit' && '📝'}
                        {activity.type === 'comment' && '💬'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-heading text-sm">{activity.user}</span>
                          <span className="text-foreground font-body">{activity.description}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activity.timestamp.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChallengeDetail;