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

	// Quick inquiry (contact page): builds a booking message from the form and sends it by text (sms: link
	// with the message pre-filled) or Messenger (copies the message, then opens the chat). No server needed.
	// Same check-in and check-out date = day use.
	var inq = document.querySelector('[data-cj-inquiry]');
	if (inq) {
		var PHONE = '+639175426468';
		var q = function (s) { return inq.querySelector(s); };
		var fName = q('#inq-name'), fGuests = q('#inq-guests'), fIn = q('#inq-in'), fOut = q('#inq-out'),
			fHall = q('#inq-hall'), fFlex = q('#inq-flex'), preview = q('[data-cj-preview]'),
			nightsEl = q('[data-cj-nights]'), errEl = q('[data-cj-error]'), noteEl = q('[data-cj-note]'),
			smsBtn = q('[data-cj-send="sms"]'), msgBtn = q('[data-cj-send="messenger"]');

		var pad = function (n) { return (n < 10 ? '0' : '') + n; };
		var toIso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
		var parse = function (s) { if (!s) return null; var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
		var fmt = function (d, withYear) {
			var o = { weekday: 'short', month: 'short', day: 'numeric' }; if (withYear) o.year = 'numeric';
			return d.toLocaleDateString('en-US', o);
		};
		var today = toIso(new Date());
		fIn.min = today; fOut.min = today; // no past dates

		function state() {
			var ci = parse(fIn.value), co = parse(fOut.value), s = { dates: 'Dates to follow', hint: '', problem: '' };
			if (ci && co) {
				var n = Math.round((co - ci) / 864e5);
				if (n < 0) { s.problem = 'Check-out can’t be before check-in.'; s.dates = fmt(ci, true) + ' (check-out to confirm)'; }
				else if (n === 0) { s.hint = 'Day use'; s.dates = 'Day use on ' + fmt(ci, true); }
				else { s.hint = n + ' night' + (n > 1 ? 's' : ''); s.dates = fmt(ci, false) + ' – ' + fmt(co, true) + ' (' + s.hint + ')'; }
			} else if (ci) { s.dates = fmt(ci, true) + ' (check-out to confirm)'; }
			if (fFlex.checked) s.dates += ' — flexible on dates';
			s.text = 'Hi Casa Jenna! I’d like to inquire about booking.\n' +
				'Name: ' + (fName.value.trim() || '—') + '\n' +
				'Dates: ' + s.dates + '\n' +
				'Guests: ' + (fGuests.value || '—') + '\n' +
				'Function hall: ' + (fHall.value || 'Not sure yet');
			return s;
		}
		function missing() {
			if (!fName.value.trim()) return [fName, 'Enter your name.'];
			if (!fIn.value) return [fIn, 'Choose your check-in date.'];
			if (!fOut.value) return [fOut, 'Choose your check-out date (the same day for day use).'];
			if (parse(fOut.value) < parse(fIn.value)) return [fOut, 'Check-out can’t be before check-in.'];
			if (!fGuests.value) return [fGuests, 'Choose the number of guests.'];
			return null;
		}
		function render() {
			var s = state();
			preview.textContent = s.text;
			nightsEl.textContent = s.hint;
			errEl.textContent = s.problem;
			// iPhones use "&body=", other phones "?body="
			smsBtn.href = 'sms:' + PHONE + (/iPhone|iPad|iPod/i.test(navigator.userAgent) ? '&' : '?') + 'body=' + encodeURIComponent(s.text);
		}
		function copy(text) { // synchronous copy (works inside the click, before Messenger opens)
			var ok = false, ta = document.createElement('textarea');
			ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
			document.body.appendChild(ta); ta.select();
			try { ok = document.execCommand('copy'); } catch (e) {}
			document.body.removeChild(ta);
			if (!ok && navigator.clipboard) { navigator.clipboard.writeText(text).catch(function () {}); ok = true; }
			return ok;
		}
		function guard(e) {
			var m = missing();
			if (m) { e.preventDefault(); errEl.textContent = m[1]; noteEl.textContent = ''; m[0].focus(); return false; }
			errEl.textContent = ''; return true;
		}

		inq.addEventListener('input', render);
		inq.addEventListener('change', function (e) {
			if (e.target === fIn && fIn.value) { // check-out can't be earlier (its calendar also opens on that month)
				fOut.min = fIn.value;
				if (fOut.value && fOut.value < fIn.value) fOut.value = ''; // clear rather than guess day use
			}
			render();
		});
		inq.addEventListener('submit', function (e) { e.preventDefault(); });
		smsBtn.addEventListener('click', function (e) {
			render();
			if (!guard(e)) return;
			noteEl.textContent = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
				? 'Opening your messages app…'
				: 'Texting works from a phone. On a computer, use Messenger or call 0917 542 6468.';
		});
		msgBtn.addEventListener('click', function (e) {
			render();
			if (!guard(e)) return;
			noteEl.textContent = copy(state().text)
				? 'Your message is copied — paste it into the Messenger chat and send.'
				: 'Messenger is opening — copy the message above and paste it into the chat.';
		});
		render();
	}
})();
