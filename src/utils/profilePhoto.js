/** User-uploaded images take precedence over Google account photos. */
export function profilePhotoUrl(user) {
  if (!user || typeof user !== 'object') return null
  const image = user.profile_image
  const candidates = [
    typeof image === 'string' ? image : image?.url,
    user.profile_image_url,
    user.google_photo_url,
    user.profileImage,
  ]
  return candidates.find(url => typeof url === 'string' && /^https?:\/\//i.test(url.trim()))?.trim() || null
}
