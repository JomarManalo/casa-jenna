/* Casa Jenna — small extras on top of BeTheme scripts.js */
(function () {
	'use strict';

	// Testimonial slider (prev / next)
	document.querySelectorAll('[data-cj-quotes]').forEach(function (root) {
		var slides = root.querySelectorAll('.cj-quote__slide');
		var author = root.querySelector('[data-cj-author]');
		var i = 0;
		function show(n) {
			i = (n + slides.length) % slides.length;
			slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
			if (author) author.textContent = slides[i].getAttribute('data-author') || '';
		}
		var prev = root.querySelector('[data-cj-prev]');
		var next = root.querySelector('[data-cj-next]');
		if (prev) prev.addEventListener('click', function () { show(i - 1); });
		if (next) next.addEventListener('click', function () { show(i + 1); });
		show(0);
	});

	// Scroll reveal
	var items = document.querySelectorAll('.cj-reveal');
	if ('IntersectionObserver' in window) {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (e) {
				if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
			});
		}, { threshold: 0.12 });
		items.forEach(function (el) { io.observe(el); });
	} else {
		items.forEach(function (el) { el.classList.add('is-in'); });
	}

	// Parallax: banner photos move slower than the page (desktop, tablets and phones).
	// Each photo layer is taller than its section (see css/custom.css) and the move is clamped to that extra room.
	(function () {
		var layers = Array.prototype.slice.call(document.querySelectorAll('.cj-hero__bg'));
		if (!layers.length || !window.requestAnimationFrame) return;
		if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (!('translate' in document.documentElement.style)) return; // very old browsers: still photos

		var items = layers.map(function (el) {
			var section = el.parentNode, isTop = !!section.closest('#Header');
			return { el: el, section: section, isTop: isTop, speed: 0.2, onScreen: true }; // matches the extra room in custom.css
		});

		var queued = false;
		function update() {
			queued = false;
			var vh = window.innerHeight;
			items.forEach(function (it) {
				if (!it.onScreen) return;
				var r = it.section.getBoundingClientRect(), room = r.height * it.speed, y;
				if (it.isTop) {
					// starts still at the top of the page, drifts down as you scroll past
					y = Math.min(Math.max(-r.top * it.speed, 0), room);
				} else {
					// centred: still when the section is in the middle of the screen
					y = Math.max(-room, Math.min(room, -(r.top + r.height / 2 - vh / 2) * it.speed));
				}
				it.el.style.translate = '0 ' + y.toFixed(1) + 'px';
			});
		}
		function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }

		if ('IntersectionObserver' in window) {
			var io = new IntersectionObserver(function (entries) {
				entries.forEach(function (e) {
					items.forEach(function (it) { if (it.section === e.target) it.onScreen = e.isIntersecting; });
				});
				queue();
			}, { rootMargin: '100px 0px' });
			items.forEach(function (it) { io.observe(it.section); });
		}
		window.addEventListener('scroll', queue, { passive: true });
		window.addEventListener('resize', queue);
		update();
	})();

	// Gallery lightbox
	var gallery = document.querySelector('[data-cj-gallery]');
	var box = document.querySelector('[data-cj-lightbox]');
	if (gallery && box) {
		var links = Array.prototype.slice.call(gallery.querySelectorAll('a'));
		var img = box.querySelector('img');
		var cap = box.querySelector('.cj-lightbox__caption');
		var cur = 0;
		var open = function (n) {
			cur = (n + links.length) % links.length;
			var a = links[cur], t = a.querySelector('figcaption');
			img.src = a.getAttribute('href');
			img.alt = a.querySelector('img').alt;
			cap.textContent = t ? t.textContent : '';
			box.classList.add('is-open');
			box.setAttribute('aria-hidden', 'false');
		};
		var close = function () { box.classList.remove('is-open'); box.setAttribute('aria-hidden', 'true'); };
		links.forEach(function (a, k) {
			a.addEventListener('click', function (e) { e.preventDefault(); open(k); });
		});
		box.querySelector('.cj-lightbox__close').addEventListener('click', close);
		box.querySelector('.cj-lightbox__prev').addEventListener('click', function () { open(cur - 1); });
		box.querySelector('.cj-lightbox__next').addEventListener('click', function () { open(cur + 1); });
		box.addEventListener('click', function (e) { if (e.target === box) close(); });
		document.addEventListener('keydown', function (e) {
			if (!box.classList.contains('is-open')) return;
			if (e.key === 'Escape') close();
			if (e.key === 'ArrowLeft') open(cur - 1);
			if (e.key === 'ArrowRight') open(cur + 1);
		});
	}

	// Contact form: front-end only until a backend/form service is connected
	var form = document.querySelector('[data-cj-form]');
	if (form) {
		form.addEventListener('submit', function (e) {
			e.preventDefault();
			var note = form.querySelector('.cj-form__note');
			if (note) note.textContent = 'Thank you! This form is not connected yet — please call or email us for now.';
		});
	}
})();
