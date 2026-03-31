import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, MapPin, X, Plus, Minus, ArrowLeft } from '@phosphor-icons/react'
import Button from '../ui/Button'
import StepIndicator from './StepIndicator'
import FoodSafetyChecklist from './FoodSafetyChecklist'
import { createListing } from '../../services/listings'
import { uploadListingPhoto } from '../../services/storage'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useLocation } from '../../hooks/useLocation'
import { ASU_BUILDINGS, getBuildingById } from '../../utils/asuBuildings'
import { DEFAULT_EXPIRY_MINUTES } from '../../utils/foodSafety'

const DIETARY_OPTIONS = ['vegan', 'vegetarian', 'halal', 'gluten-free', 'nut-free', 'dairy-free']

const INITIAL_FORM = {
  title: '',
  description: '',
  foodItems: [''],
  quantity: 1,
  dietaryTags: [],
  photoFile: null,
  photoPreview: null,
  buildingId: '',
  roomNumber: '',
  expiryMinutes: DEFAULT_EXPIRY_MINUTES,
  scheduleAhead: false,
  pickupWindowStart: '',
}

export default function PostForm() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const { location, hasGps } = useLocation()
  const navigate = useNavigate()
  const photoRef = useRef(null)

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => { const e = { ...prev }; delete e[key]; return e })
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    update('photoFile', file)
    update('photoPreview', URL.createObjectURL(file))
  }

  function addFoodItem() {
    update('foodItems', [...form.foodItems, ''])
  }

  function removeFoodItem(i) {
    update('foodItems', form.foodItems.filter((_, idx) => idx !== i))
  }

  function updateFoodItem(i, val) {
    const items = [...form.foodItems]
    items[i] = val
    update('foodItems', items)
  }

  function toggleDietary(tag) {
    update('dietaryTags', form.dietaryTags.includes(tag)
      ? form.dietaryTags.filter((t) => t !== tag)
      : [...form.dietaryTags, tag])
  }

  function validateStep0() {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (form.foodItems.filter((i) => i.trim()).length === 0) e.foodItems = 'Add at least one food item'
    if (form.quantity < 1) e.quantity = 'Quantity must be at least 1'
    return e
  }

  function validateStep1() {
    return {} // Photo is optional
  }

  function validateStep2() {
    const e = {}
    if (!form.buildingId) e.building = 'Select a building'
    return e
  }

  function nextStep() {
    let errs = {}
    if (step === 0) errs = validateStep0()
    else if (step === 1) errs = validateStep1()
    else if (step === 2) errs = validateStep2()

    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setStep((s) => s + 1)
  }

  async function handlePublish() {
    setSubmitting(true)
    try {
      const building = getBuildingById(form.buildingId)
      const tempId = `temp_${Date.now()}`

      let imageUrl = null
      if (form.photoFile) {
        imageUrl = await uploadListingPhoto(form.photoFile, tempId)
      }

      const listingData = {
        hostId: user.id,
        hostName: profile?.name || user?.user_metadata?.full_name || 'Anonymous Host',
        hostBuilding: building?.name || '',
        title: form.title.trim(),
        description: form.description.trim(),
        foodItems: form.foodItems.filter((i) => i.trim()),
        quantity: form.quantity,
        dietaryTags: form.dietaryTags,
        imageUrl,
        location: {
          lat: building?.lat || location.lat,
          lng: building?.lng || location.lng,
          buildingName: building?.name || 'Unknown Building',
          roomNumber: form.roomNumber,
        },
        expiryMinutes: form.expiryMinutes,
      }

      await createListing(listingData)
      toast('🎉 Listing posted! Students will see it now.', 'success')
      navigate('/feed')
    } catch (err) {
      toast('Failed to post listing. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const STEP_LABELS = ['Food Details', 'Photo', 'Location']

  return (
    <div className="flex flex-col min-h-dvh bg-cream pt-safe">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-cream/90 backdrop-blur-sm sticky top-0 z-10">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
          className="p-2 rounded-full hover:bg-forest-50 min-h-touch min-w-[44px] flex items-center justify-center"
        >
          <ArrowLeft size={20} className="text-forest-700" />
        </button>
        <h1 className="font-display font-bold text-lg text-forest-700 flex-1">
          {step < 3 ? `Step ${step + 1}: ${STEP_LABELS[step]}` : 'Food Safety Check'}
        </h1>
      </div>

      {step < 3 && <StepIndicator step={step} total={3} />}

      <div className="flex-1 overflow-y-auto scroll-hide">
        {step === 0 && <Step0 form={form} errors={errors} update={update} updateFoodItem={updateFoodItem} addFoodItem={addFoodItem} removeFoodItem={removeFoodItem} toggleDietary={toggleDietary} />}
        {step === 1 && <Step1 form={form} photoRef={photoRef} handlePhotoChange={handlePhotoChange} update={update} />}
        {step === 2 && <Step2 form={form} errors={errors} update={update} hasGps={hasGps} />}
        {step === 3 && <FoodSafetyChecklist onAccept={handlePublish} />}
      </div>

      {step < 3 && (
        <div className="px-4 pb-6 pt-3 bg-cream">
          <Button fullWidth onClick={nextStep} loading={submitting}>
            {step === 2 ? 'Review & Publish' : 'Continue'}
          </Button>
        </div>
      )}
    </div>
  )
}

function Step0({ form, errors, update, updateFoodItem, addFoodItem, removeFoodItem, toggleDietary }) {
  return (
    <div className="px-4 space-y-5 pb-4">
      <Field label="Listing Title" error={errors.title}>
        <input
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="e.g. Leftover Catered Mexican Food"
          className={inputClass(errors.title)}
        />
      </Field>

      <Field label="Description" error={errors.description}>
        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="What kind of food, any details students should know..."
          rows={3}
          className={`${inputClass(errors.description)} py-3 h-auto resize-none`}
        />
      </Field>

      <Field label="Food Items" error={errors.foodItems}>
        <div className="space-y-2">
          {form.foodItems.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={item}
                onChange={(e) => updateFoodItem(i, e.target.value)}
                placeholder={`Item ${i + 1}`}
                className={`${inputClass()} flex-1`}
              />
              {form.foodItems.length > 1 && (
                <button onClick={() => removeFoodItem(i)} className="p-3 text-red-400 min-h-touch">
                  <X size={18} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addFoodItem}
            className="flex items-center gap-1 text-forest-700 text-sm font-medium font-body py-2"
          >
            <Plus size={16} /> Add item
          </button>
        </div>
      </Field>

      <Field label="Portions / Servings">
        <div className="flex items-center gap-4">
          <button
            onClick={() => update('quantity', Math.max(1, form.quantity - 1))}
            className="w-11 h-11 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-forest-700"
          >
            <Minus size={18} />
          </button>
          <span className="font-display font-bold text-2xl text-gray-900 w-8 text-center">
            {form.quantity}
          </span>
          <button
            onClick={() => update('quantity', form.quantity + 1)}
            className="w-11 h-11 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-forest-700"
          >
            <Plus size={18} />
          </button>
        </div>
      </Field>

      <Field label="Dietary Tags">
        <div className="flex flex-wrap gap-2">
          {['vegan', 'vegetarian', 'halal', 'gluten-free', 'nut-free', 'dairy-free'].map((tag) => (
            <button
              key={tag}
              onClick={() => toggleDietary(tag)}
              className={[
                'px-3 py-1.5 rounded-full border-2 text-sm font-medium font-body transition-all',
                form.dietaryTags.includes(tag)
                  ? 'border-forest-700 bg-forest-700 text-white'
                  : 'border-gray-200 bg-white text-gray-600',
              ].join(' ')}
            >
              {tag}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Expires In">
        <div className="flex gap-2">
          {[30, 60, 90, 120, 180].map((m) => (
            <button
              key={m}
              onClick={() => update('expiryMinutes', m)}
              className={[
                'flex-1 py-2 rounded-card border-2 text-xs font-medium font-body transition-all',
                form.expiryMinutes === m
                  ? 'border-forest-700 bg-forest-700 text-white'
                  : 'border-gray-200 bg-white text-gray-600',
              ].join(' ')}
            >
              {m < 60 ? `${m}m` : `${m / 60}h`}
            </button>
          ))}
        </div>
      </Field>
    </div>
  )
}

function Step1({ form, photoRef, handlePhotoChange, update }) {
  return (
    <div className="px-4 space-y-4 pb-4">
      <p className="text-sm text-gray-500 font-body">Add a photo to help students identify the food. Optional but recommended.</p>

      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoChange}
        className="hidden"
      />

      {form.photoPreview ? (
        <div className="relative rounded-card overflow-hidden bg-forest-50">
          <img src={form.photoPreview} alt="Preview" className="w-full h-56 object-cover" />
          <button
            onClick={() => { update('photoFile', null); update('photoPreview', null) }}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => photoRef.current?.click()}
          className="w-full h-48 rounded-card border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 bg-white hover:border-forest-400 transition-colors"
        >
          <div className="w-14 h-14 rounded-full bg-forest-50 flex items-center justify-center">
            <Camera size={28} className="text-forest-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 font-body">Take or upload a photo</p>
            <p className="text-xs text-gray-400 font-body mt-1">JPG, PNG, HEIC up to 10MB</p>
          </div>
        </button>
      )}

      {!form.photoFile && (
        <p className="text-xs text-gray-400 font-body text-center">
          No photo? No problem — listing will still post with a placeholder.
        </p>
      )}
    </div>
  )
}

function Step2({ form, errors, update, hasGps }) {
  return (
    <div className="px-4 space-y-5 pb-4">
      <Field label="Building" error={errors.building}>
        <select
          value={form.buildingId}
          onChange={(e) => update('buildingId', e.target.value)}
          className={inputClass(errors.building)}
        >
          <option value="">Select a building</option>
          {ASU_BUILDINGS.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Room Number (optional)">
        <input
          value={form.roomNumber}
          onChange={(e) => update('roomNumber', e.target.value)}
          placeholder="e.g. 101, Lobby, 2nd Floor Lounge"
          className={inputClass()}
        />
      </Field>

      {!hasGps && (
        <div className="bg-amber-50 border border-amber-200 rounded-card p-3 text-xs text-amber-700 font-body">
          GPS unavailable — we'll use the selected building's coordinates for map placement.
        </div>
      )}
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5 font-body">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

function inputClass(error) {
  return `w-full h-[52px] px-4 rounded-card border bg-white font-body text-base focus:outline-none focus:ring-2 focus:ring-forest-400 ${error ? 'border-red-400' : 'border-gray-200'}`
}
