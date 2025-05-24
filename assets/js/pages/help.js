document.addEventListener('DOMContentLoaded', () => {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('dt');
    const answer = item.querySelector('dd');
    const icon = question.querySelector('svg');

    question.addEventListener('click', () => {
      const isOpen = answer.classList.contains('active');

      // Close all other open answers
      // faqItems.forEach(otherItem => {
      //   if (otherItem !== item) {
      //     otherItem.querySelector('dd').classList.remove('active');
      //     otherItem.querySelector('dd').style.maxHeight = null;
      //     otherItem.querySelector('dt svg').classList.remove('rotate-180');
      //   }
      // });

      answer.classList.toggle('active');
      icon.classList.toggle('rotate-180');

      if (answer.classList.contains('active')) {
        answer.style.display = 'block'; // Make sure it's block before getting scrollHeight
        answer.style.maxHeight = answer.scrollHeight + 'px';
        answer.style.opacity = '1';
        answer.style.marginTop = '0.5rem'; // Match spacing
        answer.style.paddingBottom = '1rem'; // Match spacing
      } else {
        answer.style.maxHeight = '0';
        answer.style.opacity = '0';
        // Wait for transition to finish before setting display to none
        setTimeout(() => {
          if (!answer.classList.contains('active')) { // Check again in case it was quickly reopened
            answer.style.display = 'none';
          }
        }, 300); // Should match transition duration
      }
    });

    // Initial setup for smooth transition - hide answers
    if (!answer.classList.contains('active')) {
      answer.style.maxHeight = '0';
      answer.style.opacity = '0';
      answer.style.overflow = 'hidden';
      answer.style.transition = 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, margin-top 0.3s ease-in-out, padding-bottom 0.3s ease-in-out';
      // Set display to none initially after a short delay to avoid flash of content
      // and ensure it's hidden if not active on load
      setTimeout(() => {
        if (!answer.classList.contains('active')) {
            answer.style.display = 'none';
        }
      }, 0);
    } else {
      // If an item is meant to be active on load (e.g. by adding 'active' class in HTML)
      answer.style.display = 'block';
      answer.style.maxHeight = answer.scrollHeight + 'px';
      answer.style.opacity = '1';
      icon.classList.add('rotate-180');
    }
  });
}); 