import { el } from '../utils.js';

export function AboutPage(){
  const wrap = el('div', { class:'section' });
  wrap.append(
    el('h2', { text:'About NovaIoT' }),
    el('p', { text:'We curate reliable IoT devices for modern homes — from smart sensors and hubs to lighting, security, and energy monitoring. Our team hand‑selects interoperable products that are easy to set up and built to last.' }),
    el('div', { class:'grid section' },
      el('div', { class:'col-4' },
        el('div', { class:'card' }, el('div', { class:'card__body' },
          el('div', { class:'card__title', text:'4.7★ Average Rating' }),
          el('p', { class:'muted', text:'Based on verified customer reviews.' })
        ))
      ),
      el('div', { class:'col-4' },
        el('div', { class:'card' }, el('div', { class:'card__body' },
          el('div', { class:'card__title', text:'48–72h Delivery' }),
          el('p', { class:'muted', text:'Fast, tracked shipping across the EU.' })
        ))
      ),
      el('div', { class:'col-4' },
        el('div', { class:'card' }, el('div', { class:'card__body' },
          el('div', { class:'card__title', text:'30‑Day Returns' }),
          el('p', { class:'muted', text:'Hassle‑free returns on eligible items.' })
        ))
      ),
    ),
    el('div', { class:'grid' },
      el('div', { class:'col-12' },
        el('h3', { text:'Our Promise' }),
        el('ul', {},
          el('li', { text:'Quality you can feel and rely on' }),
          el('li', { text:'Fast, tracked shipping on every order' }),
          el('li', { text:'30‑day hassle‑free returns' }),
          el('li', { text:'Secure checkout and responsive support' }),
        ),
      ),
    ),
    el('div', { class:'grid section' },
      el('div', { class:'col-6' },
        el('h3', { text:'Our Story' }),
        el('p', { text:'NovaIoT started with a simple idea: make smart homes accessible. We partner with trusted manufacturers and test devices in‑house across major ecosystems (Matter, HomeKit, Google Home, Alexa).' }),
        el('p', { text:'We are a small, distributed team of IoT enthusiasts. Every device we carry has a purpose — to make homes safer, greener, and more convenient.' })
      ),
      el('div', { class:'col-6' },
        el('h3', { text:'Sustainability' }),
        el('ul', {},
          el('li', { text:'Carbon‑neutral shipping on most orders' }),
          el('li', { text:'Minimal, recyclable packaging' }),
          el('li', { text:'Long‑life products to reduce waste' })
        )
      ),
    ),
    el('div', { class:'grid section' },
      el('div', { class:'col-6' },
        el('div', { class:'card' }, el('div', { class:'card__body' },
          el('h3', { text:'Shipping & Returns' }),
          el('p', { text:'Most orders ship within 24 hours. Delivery within 48–72 hours in the EU.' }),
          el('ul', {},
            el('li', { text:'Free shipping for orders over €60' }),
            el('li', { text:'30‑day returns, fast refunds' }),
            el('li', { text:'Pre‑paid return labels available' })
          )
        ))
      ),
      el('div', { class:'col-6' },
        el('div', { class:'card' }, el('div', { class:'card__body' },
          el('h3', { text:'Payment & Security' }),
          el('p', { text:'We accept Visa, MasterCard, Amex, PayPal, and Apple Pay.' }),
          el('p', { class:'muted', text:'All payments are processed over secure, PCI‑compliant gateways.' })
        ))
      ),
    ),
    el('h3', { text:'FAQ' }),
    el('div', { class:'section faq-list' },
      el('details', { class:'card' },
        el('summary', { class:'card__body', text:'When will my order ship?' }),
        el('div', { class:'card__body' }, el('p', { text:'Orders placed before 16:00 CET ship the same business day.' }))
      ),
      el('details', { class:'card' },
        el('summary', { class:'card__body', text:'How do I start a return?' }),
        el('div', { class:'card__body' }, el('p', { text:'Contact support with your order ID. We’ll generate a pre‑paid label.' }))
      ),
      el('details', { class:'card' },
        el('summary', { class:'card__body', text:'Do you ship internationally?' }),
        el('div', { class:'card__body' }, el('p', { text:'We currently ship within the EU. Global shipping is coming soon.' }))
      ),
    ),
  );
  return wrap;
}
