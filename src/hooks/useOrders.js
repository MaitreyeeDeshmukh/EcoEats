import { useState, useEffect } from 'react'
import { getUserOrders, getOrderById } from '../services/orders'

export function useOrders(uid) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    getUserOrders(uid)
      .then(data => { setOrders(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [uid])

  return { orders, loading, error }
}

export function useOrder(id) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    getOrderById(id)
      .then(data => { setOrder(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [id])

  return { order, loading, error }
}
