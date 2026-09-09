'use client'

import { useState, useEffect, useCallback } from 'react'

export interface GeoLocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null // in meters
  altitude: number | null
  speed: number | null
  heading: number | null
  timestamp: number | null
  status: 'idle' | 'loading' | 'success' | 'denied' | 'unavailable'
  errorMessage: string | null
  isSimulated: boolean
}

// Default classroom anchor point (e.g. Computer Science Lab Room 402, Bangkok)
const DEFAULT_LAB_COORDS = {
  latitude: 13.75633,
  longitude: 100.50176,
  accuracy: 4.5,
  altitude: 12.0,
}

export function useGeolocation() {
  const [geoState, setGeoState] = useState<GeoLocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    speed: null,
    heading: null,
    timestamp: null,
    status: 'idle',
    errorMessage: null,
    isSimulated: false,
  })

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGeoState((prev) => ({
        ...prev,
        status: 'unavailable',
        errorMessage: 'เบราว์เซอร์นี้ไม่รองรับ Geolocation API (สลับไปใช้พิกัดจำลองของห้องแล็บแทน)',
        isSimulated: true,
        latitude: DEFAULT_LAB_COORDS.latitude,
        longitude: DEFAULT_LAB_COORDS.longitude,
        accuracy: DEFAULT_LAB_COORDS.accuracy,
        altitude: DEFAULT_LAB_COORDS.altitude,
        timestamp: Date.now(),
      }))
      return
    }

    setGeoState((prev) => ({ ...prev, status: 'loading', errorMessage: null }))

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp,
          status: 'success',
          errorMessage: null,
          isSimulated: false,
        })
      },
      (error) => {
        console.warn('Geolocation error:', error.message)
        // Graceful fallback to lab coordinates so student experience is not blocked
        setGeoState({
          latitude: DEFAULT_LAB_COORDS.latitude,
          longitude: DEFAULT_LAB_COORDS.longitude,
          accuracy: DEFAULT_LAB_COORDS.accuracy,
          altitude: DEFAULT_LAB_COORDS.altitude,
          speed: null,
          heading: null,
          timestamp: Date.now(),
          status: error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable',
          errorMessage:
            error.code === error.PERMISSION_DENIED
              ? 'ไม่ได้รับสิทธิ์เข้าถึงพิกัด GPS (ใช้พิกัดจำลองของห้องแล็บแทน)'
              : 'สัญญาณ GPS อุปกรณ์ขัดข้อง (ใช้พิกัดจำลองของห้องแล็บแทน)',
          isSimulated: true,
        })
      },
      options
    )
  }, [])

  // Auto request on first mount
  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  const setSimulatedCoords = useCallback((lat: number, lng: number) => {
    setGeoState((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      accuracy: 2.0,
      status: 'success',
      isSimulated: true,
      errorMessage: null,
      timestamp: Date.now(),
    }))
  }, [])

  return {
    ...geoState,
    requestLocation,
    setSimulatedCoords,
  }
}
