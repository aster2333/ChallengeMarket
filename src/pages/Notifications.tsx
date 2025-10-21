import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, BellRing, Gift, Megaphone, Sparkles, Trophy } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';

type NotificationCategory = 'votes' | 'results' | 'rewards' | 'system';
type FilterValue = 'all' | 'unread' | NotificationCategory;
type SectionKey = 'today' | 'recent' | 'earlier';

interface NotificationItem {
  id: string;
  category: NotificationCategory;
  timestamp: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
}

const categoryStyles: Record<NotificationCategory, { icon: string; badge: string }> = {
  votes: {
    icon: 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300',
    badge: 'bg-sky-500/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200'
  },
  results: {
    icon: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-200',
    badge: 'bg-violet-500/15 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200'
  },
  rewards: {
    icon: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
  },
  system: {
    icon: 'bg-amber-400/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-200',
    badge: 'bg-amber-400/20 text-amber-700 dark:bg-amber-400/25 dark:text-amber-100'
  }
};

const iconMap: Record<NotificationCategory, React.ComponentType<{ className?: string }>> = {
  votes: Megaphone,
  results: Trophy,
  rewards: Gift,
  system: Sparkles
};

const sectionOrder: SectionKey[] = ['today', 'recent', 'earlier'];

const Notifications: React.FC = () => {
  const { t: tNotifications } = useTranslation('notifications');
  const { t: tCommon, i18n } = useTranslation('common');
  const [filter, setFilter] = React.useState<FilterValue>('all');
  const [readIds, setReadIds] = React.useState<string[]>(() => ['reward-ecosystem', 'system-weekly']);

  const formatAbsoluteTime = React.useCallback(
    (isoString: string) =>
      new Intl.DateTimeFormat(i18n.language, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(isoString)),
    [i18n.language]
  );

  const formatRelativeTime = React.useCallback(
    (isoString: string) => {
      const target = new Date(isoString).getTime();
      const diff = Date.now() - target;

      if (diff < 45 * 1000) {
        return tNotifications('meta.just_now');
      }

      const totalSeconds = Math.max(1, Math.floor(diff / 1000));
      const totalMinutes = Math.floor(totalSeconds / 60);
      const totalHours = Math.floor(totalMinutes / 60);
      const totalDays = Math.floor(totalHours / 24);

      if (totalMinutes < 1) {
        return `${totalSeconds} ${tCommon('time.seconds')} ${tCommon('time.ago')}`;
      }
      if (totalHours < 1) {
        return `${totalMinutes} ${tCommon('time.minutes')} ${tCommon('time.ago')}`;
      }
      if (totalDays < 1) {
        return `${totalHours} ${tCommon('time.hours')} ${tCommon('time.ago')}`;
      }
      return `${totalDays} ${tCommon('time.days')} ${tCommon('time.ago')}`;
    },
    [tCommon, tNotifications]
  );

  const getSectionKey = React.useCallback((isoString: string): SectionKey => {
    const date = new Date(isoString);
    const now = new Date();

    const isSameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    if (isSameDay) {
      return 'today';
    }

    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return 'recent';
    }

    return 'earlier';
  }, []);

  const baseNotifications = React.useMemo<NotificationItem[]>(() => {
    const now = new Date();
    const subtractHours = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
    const subtractDays = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    const addHours = (hours: number) => new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();

    const challengeNames = {
      aiAdoption: tNotifications('challenge_names.ai_adoption'),
      codingMarathon: tNotifications('challenge_names.coding_marathon'),
      ecosystemHealth: tNotifications('challenge_names.ecosystem_health')
    } as const;

    return [
      {
        id: 'vote-ai-adoption',
        category: 'votes',
        timestamp: subtractHours(0.5),
        title: tNotifications('items.vote_open.title', { challenge: challengeNames.aiAdoption }),
        description: tNotifications('items.vote_open.description', {
          challenge: challengeNames.aiAdoption,
          deadline: formatAbsoluteTime(addHours(4))
        }),
        actionLabel: tNotifications('items.vote_open.action'),
        actionLink: '/challenge/3'
      },
      {
        id: 'result-coding-marathon',
        category: 'results',
        timestamp: subtractHours(6),
        title: tNotifications('items.result_posted.title', { challenge: challengeNames.codingMarathon }),
        description: tNotifications('items.result_posted.description', {
          challenge: challengeNames.codingMarathon
        }),
        actionLabel: tNotifications('items.result_posted.action'),
        actionLink: '/challenge/3'
      },
      {
        id: 'reward-ecosystem',
        category: 'rewards',
        timestamp: subtractHours(28),
        title: tNotifications('items.reward_credited.title'),
        description: tNotifications('items.reward_credited.description', {
          amount: '0.85 SOL',
          challenge: challengeNames.ecosystemHealth
        }),
        actionLabel: tNotifications('items.reward_credited.action'),
        actionLink: '/profile'
      },
      {
        id: 'system-weekly',
        category: 'system',
        timestamp: subtractDays(3),
        title: tNotifications('items.system_digest.title'),
        description: tNotifications('items.system_digest.description'),
        actionLabel: tNotifications('items.system_digest.action'),
        actionLink: '/'
      }
    ];
  }, [formatAbsoluteTime, tNotifications]);

  const notifications = React.useMemo(
    () =>
      baseNotifications.map((item) => ({
        ...item,
        isRead: readIds.includes(item.id)
      })),
    [baseNotifications, readIds]
  );

  const filteredNotifications = React.useMemo(
    () =>
      notifications.filter((item) => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !item.isRead;
        return item.category === filter;
      }),
    [filter, notifications]
  );

  const sortedNotifications = React.useMemo(
    () =>
      [...filteredNotifications].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [filteredNotifications]
  );

  const groupedNotifications = React.useMemo(() => {
    const groups: Record<SectionKey, typeof sortedNotifications> = {
      today: [],
      recent: [],
      earlier: []
    };

    sortedNotifications.forEach((item) => {
      const key = getSectionKey(item.timestamp);
      groups[key].push(item);
    });

    return groups;
  }, [getSectionKey, sortedNotifications]);

  const markAsRead = React.useCallback((id: string) => {
    setReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const markAllRead = React.useCallback(() => {
    setReadIds((prev) => {
      const allIds = notifications.map((item) => item.id);
      const hasAll = allIds.every((id) => prev.includes(id));
      return hasAll ? prev : allIds;
    });
  }, [notifications]);

  const hasUnread = React.useMemo(() => notifications.some((item) => !item.isRead), [notifications]);

  const filterOptions = React.useMemo(
    () => [
      { value: 'all' as FilterValue, label: tNotifications('filters.all') },
      { value: 'unread' as FilterValue, label: tNotifications('filters.unread') },
      { value: 'votes' as FilterValue, label: tNotifications('filters.votes') },
      { value: 'results' as FilterValue, label: tNotifications('filters.results') },
      { value: 'rewards' as FilterValue, label: tNotifications('filters.rewards') },
      { value: 'system' as FilterValue, label: tNotifications('filters.system') }
    ],
    [tNotifications]
  );

  const isEmpty = sortedNotifications.length === 0;

  return (
    <main className="bg-gradient-to-b from-background via-background to-muted/20">
      <div className="mx-auto w-full max-w-4xl px-4 pb-24 pt-8 md:px-8 md:pb-16">
        <div className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur md:flex-row md:items-start md:justify-between md:p-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {tNotifications('title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              {tNotifications('description')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'self-start rounded-full border border-border px-4 text-sm font-medium transition-colors md:self-center',
              hasUnread
                ? 'text-primary hover:bg-primary/10 hover:text-primary'
                : 'text-muted-foreground hover:bg-muted'
            )}
            onClick={markAllRead}
            disabled={!hasUnread}
          >
            {tNotifications('actions.mark_all_read')}
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'rounded-full border px-4 py-1 text-sm font-medium transition-colors',
                filter === option.value
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="mt-8 space-y-10">
          {sectionOrder.map((section) => {
            const sectionItems = groupedNotifications[section];
            if (!sectionItems || sectionItems.length === 0) {
              return null;
            }

            return (
              <section key={section}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {tNotifications(`sections.${section}`)}
                </h2>
                <div className="mt-4 space-y-3">
                  {sectionItems.map((item) => {
                    const Icon = iconMap[item.category];
                    const styles = categoryStyles[item.category];

                    return (
                      <article
                        key={item.id}
                        className={cn(
                          'group flex gap-4 rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-lg md:gap-6 md:p-6',
                          !item.isRead && 'border-primary/40 bg-primary/5'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-colors group-hover:scale-105',
                            styles.icon
                          )}
                        >
                          <Icon className="h-6 w-6" />
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
                            <h3 className="text-base font-semibold text-foreground md:text-lg">
                              {item.title}
                            </h3>
                            {!item.isRead && (
                              <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
                            )}
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                            {item.description}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <Badge
                              variant="outline"
                              className={cn('border-0 px-2.5 py-1 text-xs font-medium', styles.badge)}
                            >
                              {tNotifications(`types.${item.category}`)}
                            </Badge>
                            <span title={formatAbsoluteTime(item.timestamp)}>
                              {formatRelativeTime(item.timestamp)}
                            </span>
                            <div className="ml-auto flex items-center gap-2">
                              {!item.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 rounded-full px-3 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary"
                                  onClick={() => markAsRead(item.id)}
                                >
                                  {tNotifications('actions.mark_read')}
                                </Button>
                              )}
                              {item.actionLabel && item.actionLink && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 rounded-full px-3 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary"
                                  asChild
                                >
                                  <Link to={item.actionLink} onClick={() => markAsRead(item.id)} className="flex items-center gap-1">
                                    <span>{item.actionLabel}</span>
                                    <ArrowRight className="h-4 w-4" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {isEmpty && (
          <div className="mt-16 flex flex-col items-center rounded-3xl border border-dashed border-border/60 bg-card/70 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BellRing className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-lg font-semibold text-foreground md:text-xl">
              {tNotifications('empty.title')}
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground md:text-base">
              {tNotifications('empty.description')}
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default Notifications;
