import { ipcBackend } from '../ipc'
import { DeltaBackend } from '../delta-remote'
import { Store } from './store'
import { getLogger } from '../../shared/logger'
import debounce from 'debounce'
import { JsonContact } from '../../shared/shared-types'
const log = getLogger('renderer/stores/contacts')

export class contactsStoreState {
  contacts: JsonContact[] = []
  blockedContacts: JsonContact[] = []
  queryGroupContacts = ''
  queryNonGroupContacts = ''
}
const contactsStore = new Store(new contactsStoreState(), 'contact')

contactsStore.attachEffect(async action => {
  if (action.type === 'UI_UNBLOCK_CONTACT') {
    const contactId = action.payload
    await DeltaBackend.call('contacts.unblockContact', contactId)
    await DeltaBackend.call('updateBlockedContacts')
  }
})

ipcBackend.on(
  'DD_EVENT_BLOCKED_CONTACTS_UPDATED',
  (_evt, payload: { blockedContacts: JsonContact[] }) => {
    const { blockedContacts } = payload
    const state = contactsStore.getState()
    contactsStore.setState({ ...state, blockedContacts })
  }
)

ipcBackend.on(
  'DD_EVENT_CONTACTS_UPDATED',
  debounce(
    (_evt, payload: { contacts: JsonContact[] }) => {
      const { contacts } = payload
      const state = contactsStore.getState()
      log.debug('DD_EVENT_CONTACTS_UPDATED', contacts)
      contactsStore.setState({ ...state, contacts })
    },
    500,
    true
  )
)

export default contactsStore
