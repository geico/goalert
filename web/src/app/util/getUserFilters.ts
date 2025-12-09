export default function getUserFilters(input: string): {
  labelKey: string
  labelValue: string
  phoneNumber: string
} {
  // grab key and value from the input param, if at all
  let labelKey = ''
  let labelValue = ''
  let phoneNumber = ''
  
  if (input.includes('phone=')) {
    const phoneMatch = input.match(/phone=([^&\s]*)/)
    if (phoneMatch) {
      phoneNumber = phoneMatch[1]
      input = input.replace(phoneMatch[0], '').trim() // remove phone string from input
    }
  }
  
  if (input.includes('=') && !input.includes('phone=')) {
    const searchSplit = input.split(/(!=|=)/)
    labelKey = searchSplit[0]
    // the value can contain "=", so joining the rest of the match such that it doesn't get lost
    labelValue = searchSplit.slice(2).join('')
  }

  return { labelKey, labelValue, phoneNumber }
}