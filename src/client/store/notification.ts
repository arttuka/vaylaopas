import { VariantType } from 'notistack'
import { StateCreator } from 'zustand'
import { Key, Notification } from '../../common/types'
import { makeIdGenerator } from '../../common/util'
import type { State } from './store'

type EnqueueProps = { key?: Key; message: string; variant: VariantType }

export type NotificationSlice = {
  notifications: Notification[]
  enqueueNotification: (notification: EnqueueProps) => void
  removeNotification: (key: Key) => void
}

const generateKey = makeIdGenerator('notification')

export const createNotificationSlice: StateCreator<
  State,
  [],
  [],
  NotificationSlice
> = (set) => ({
  notifications: [],
  enqueueNotification: ({ key, message, variant }) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { key: key || generateKey(), message, variant },
      ],
    })),
  removeNotification: (key) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.key !== key),
    })),
})
