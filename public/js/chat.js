const socket = io()


//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton =$messageForm.querySelector('button')
const $sendLocation = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const locationTemplate = document.querySelector('#location-template').innerHTML
const messageTemplate = document.querySelector('#message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const {username, room} =Qs.parse(location.search, {ignoreQueryPrefix: true})// location.search will have us access to the query string in the URL

const autoScroll = () => {
// New message element
const $newMessage = $messages.lastElementChild
// Height of the new message
const newMessageStyles = getComputedStyle($newMessage)
const newMessageMargin = parseInt(newMessageStyles.marginBottom)
const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
// Visible height
const visibleHeight = $messages.offsetHeight
// Height of messages container
const containerHeight = $messages.scrollHeight
// How far have I scrolled?
const scrollOffset = $messages.scrollTop + visibleHeight
if (containerHeight - newMessageHeight <= scrollOffset) {
$messages.scrollTop = $messages.scrollHeight
}
}


socket.on('message', (message)=>{
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text ,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on("locationMessage", (message) =>{
    console.log(message.url)
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({room, users}) =>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
  document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e)=>{
    event.preventDefault()
    console.log('message form',$messageForm)

    $messageFormButton.setAttribute('disabled','disabled')

    const message = e.target.elements.message.value
    //adding a function as third arg as a callback to bu executed by the server upon receiving the event  ....Aknowledgment
    socket.emit('SendMessage',message, (error) =>{
       $messageFormButton.removeAttribute('disabled')
       $messageFormInput.value = ''
       $messageFormButton.focus()
        if (error){
            return console.log(error)
        }

        console.log('Message Delivered')
    })
    
})





$sendLocation.addEventListener('click', () =>{
    
    if (!navigator.geolocation){
        return alert('GeoLocation is not supported by your browser')
    }
    $sendLocation.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position) =>{
        console.log(position)
        socket.emit('SendLocation', {
            lat: position.coords.latitude,
            long: position.coords.latitude
        }, () =>{
            $sendLocation.removeAttribute('disabled')
            console.log('Location Shared')})
    })
})


socket.emit('join', {username, room}, (error) =>{
    if(error){
        alert(error)
        location.href='/'
    }
})