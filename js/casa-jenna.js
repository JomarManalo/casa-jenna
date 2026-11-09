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
