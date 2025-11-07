import { ROUTES_PATH } from '../constants/routes.js'
import { formatDate, formatStatus } from '../app/format.js'
import Logout from './Logout.js'

// Default export of the Bills class
export default class {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store

    // Bind "New Bill" button to navigation handler
    const buttonNewBill = document.querySelector(
      `button[data-testid="btn-new-bill"]`
    )
    if (buttonNewBill)
      buttonNewBill.addEventListener('click', this.handleClickNewBill)

    // Bind each "eye icon" to open modal preview of bill proof
    const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`)
    if (iconEye)
      iconEye.forEach((icon) => {
        icon.addEventListener('click', () => this.handleClickIconEye(icon))
      })

    // Initialize logout button logic
    new Logout({ document, localStorage, onNavigate })
  }

  // Handles the click on the "New Bill" button
  handleClickNewBill = () => {
    this.onNavigate(ROUTES_PATH['NewBill'])
  }

  // Handles clicking the eye icon: opens a modal showing the bill image
  handleClickIconEye = (icon) => {
    const billUrl = icon.getAttribute('data-bill-url')
    const imgWidth = Math.floor($('#modaleFile').width() * 0.5)
    $('#modaleFile')
      .find('.modal-body')
      .html(
        `<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`
      )
    $('#modaleFile').modal('show')
  }

  // Fetches bills from the store, formats and sorts them
  getBills = () => {
    if (this.store) {
      return this.store
        .bills()
        .list()
        .then((snapshot) => {
          const bills = snapshot
            .map((doc) => {
              try {
                return {
                  ...doc,
                  date: doc.date, // keep raw date for sorting
                  formattedDate: formatDate(doc.date), // Formatted for display (DD/MM/YYYY)
                  status: formatStatus(doc.status), // Format the status string
                }
              } catch (e) {
                // Handle case where formatDate throws
                return {
                  ...doc,
                  date: doc.date,
                  formattedDate: doc.date,
                  status: formatStatus(doc.status),
                }
                console.log('error dans la date')
              }
            })
            // Sort bills by raw date descending (latest bills first)
            .sort((a, b) => new Date(b.date) - new Date(a.date))

          console.log(
            'FINAL DATES:',
            bills.map((b) => b.date)
          )
          // Return the formatted and sorted bills
          return bills
        })
    }
  }
}
