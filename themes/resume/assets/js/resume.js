const Sections = document.querySelector('#sections');
const Body = document.querySelector('body');
const Nav = document.querySelector('nav');

Body.style.paddingTop = Nav.getBoundingClientRect().height + 'px';
Sections.style.paddingTop = Nav.getBoundingClientRect().height + 'px';

// Check if viewport is md or wider
const mediaQuery = window.matchMedia('(min-width: 768px)');

// Add or remove 'show' class based on media query
function handleMediaQuery() {
    if (mediaQuery.matches) {
        Sections.classList.add('show');
    } else {
        Sections.classList.remove('show');
    }
}


// sections padding


function addPaddingToSections() {
    if (window.innerWidth < 768) {
        const NavHeight = Nav.getMaxHeight;
        Sections.style.paddingTop = NavHeight + "px";
    } else {
        Sections.style.paddingTop = '0';
    }
}

// Run on window resize
// window.addEventListener('resize', handleMediaQuery);
// window.addEventListener('resize', addPaddingToSections);

// // Call the functions on page load to set initial padding
// handleMediaQuery();
// addPaddingToSections();