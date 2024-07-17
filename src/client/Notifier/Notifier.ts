import { FC, useEffect } from 'react'
import { useSnackbar } from 'notistack'
import { useShallow } from 'zustand/react/shallow'
import { Key } from '../../common/types'
import { useStore } from '../store/store'

let displayed: Key[] = []
const setDisplayed = (key: Key): void => {
  displayed = [...displayed, key]
}
const removeDisplayed = (key: Key): void => {
  displayed = displayed.filter((k) => k !== key)
}

const Notifier: FC = () => {
  const { notifications, removeNotification } = useStore(
    useShallow((state) => ({
      notifications: state.notifications,
      removeNotification: state.removeNotification,
    }))
  )
  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    notifications.forEach(({ key, message, variant }) => {
      if (displayed.includes(key)) {
        return
      }

      enqueueSnackbar(message, {
        key,
        variant,
        onExited: (node, key) => {
          removeNotification(key)
          removeDisplayed(key)
        },
      })

      setDisplayed(key)
    })
  }, [notifications, enqueueSnackbar, removeNotification])

  return null
}

export default Notifier
