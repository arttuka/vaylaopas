import { FC, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSnackbar } from 'notistack'
import { notificationRemoveAction } from '../redux/actions'
import { notificationsSelector } from '../redux/selectors'
import { Key } from '../../common/types'

let displayed: Key[] = []
const setDisplayed = (key: Key): void => {
  displayed = [...displayed, key]
}
const removeDisplayed = (key: Key): void => {
  displayed = displayed.filter((k) => k !== key)
}

const Notifier: FC = () => {
  const dispatch = useDispatch()
  const notifications = useSelector(notificationsSelector)
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
          dispatch(notificationRemoveAction({ key }))
          removeDisplayed(key)
        },
      })

      setDisplayed(key)
    })
  }, [notifications, enqueueSnackbar, dispatch])

  return null
}

export default Notifier
