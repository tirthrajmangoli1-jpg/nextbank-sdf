import { getDatabase } from '../db';
import { runAtomic } from '../db/atomic';
import { AppNotification } from '../types';
import { simulateLatency } from './delay';

export const notificationApi = {
  async getNotifications(): Promise<AppNotification[]> {
    await simulateLatency(100, 200);
    const db = getDatabase();
    const currentUserId = db.session?.userId || db.users[0]?.id;
    return db.notifications.filter((n) => n.userId === currentUserId);
  },

  async markAsRead(id: string): Promise<void> {
    await simulateLatency(100, 200);
    runAtomic((snapshot) => {
      const notif = snapshot.notifications.find((n) => n.id === id);
      if (notif) notif.read = true;
      return { nextDb: snapshot, result: null };
    });
  },

  async markAllAsRead(): Promise<void> {
    await simulateLatency(100, 200);
    const db = getDatabase();
    const currentUserId = db.session?.userId || db.users[0]?.id;

    runAtomic((snapshot) => {
      snapshot.notifications
        .filter((n) => n.userId === currentUserId)
        .forEach((n) => (n.read = true));
      return { nextDb: snapshot, result: null };
    });
  },

  async clearAll(): Promise<void> {
    await simulateLatency(100, 200);
    const db = getDatabase();
    const currentUserId = db.session?.userId || db.users[0]?.id;

    runAtomic((snapshot) => {
      snapshot.notifications = snapshot.notifications.filter(
        (n) => n.userId !== currentUserId
      );
      return { nextDb: snapshot, result: null };
    });
  },
};
