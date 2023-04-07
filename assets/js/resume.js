const Sections = document.querySelector('#sections');
const Body = document.querySelector('body');
const Nav = document.querySelector('nav');
const NavItems = document.querySelector('#navbarNav');

Body.style.paddingTop = Nav.getBoundingClientRect().height + 'px';
Sections.style.marginTop = Nav.getBoundingClientRect().height + 'px';

const observer = new MutationObserver(function(mutationsList, observer) {
  // Iterate through the mutations list
  for (let mutation of mutationsList) {
    // Check if the mutation is a class attribute mutation on myDiv
    if (mutation.type === 'attributes' && mutation.target === NavItems && mutation.attributeName === 'class') {
      // Check if the show class has been added to myDiv
      if (NavItems.classList.contains('show') && !mutation.oldValue.includes('show')) {
        console.log('The "show" class has been added to the div!');
        Sections.style.marginTop = Nav.getBoundingClientRect().height + 'px';
      }
    }
  }
});

// Configure the observer to watch for changes to the class attribute of myDiv
observer.observe(NavItems, { attributes: true, attributeOldValue: true, attributeFilter: ['class'] });