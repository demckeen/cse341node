let plus_btns = document.querySelectorAll('.productPlusBtn');
let minus_btns = document.querySelectorAll('.productMinusBtn');

function increaseQuantity(Event) {
    console.log(Event.target);
    console.log(Event.target.previousElementSibling.getAttribute('value'));
    let input = Event.target.previousElementSibling;
        if (input.getAttribute("value") === '0') {
            input.setAttribute('value', 1) ;
        }
        else {
        input.setAttribute('value', (parseInt(input.getAttribute('value')) + 1 ));
        }
}

function decreaseQuantity(Event) {
    let input = Event.target.nextElementSibling;
    if (input.getAttribute("value") === '1') {
        input.setAttribute('value', 0);
    }
    else if (input.getAttribute("value") > '1'){
    input.setAttribute('value', (parseInt(input.getAttribute('value')) - 1 ));
    }
}

plus_btns.forEach(btn=>{
    btn.addEventListener('click', increaseQuantity)});

minus_btns.forEach(btn=>{
    btn.addEventListener('click', decreaseQuantity)});

function closeCartMessage() {
    console.log('Event triggered!');
    document.getElementById('messageContainer').style.display = 'none';
    document.getElementById()
    console.log('Modal closed!')

}