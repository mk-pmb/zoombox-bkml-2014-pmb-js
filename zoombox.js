/* -*- coding: UTF-8, tab-width: 2 -*- */
/*jslint indent: 2, maxlen: 80, continue: true, browser: true */
/***** LICENSE *****
Zoombox Bookmarklet: Add a lightbox to zoom-linked images
Copyright (C) 2014-2019  Marcel Krause <mk+copyleft@pimpmybyte.de>

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*****/
//javascript:
(function () {
  'use strict';
  var jq = window.jQuery, body = document.getElementsByTagName('body')[0],
    zoomImgs = [], defaultThumbRgx = /[\.\-]\d+x\d+(?=\.[a-z0-9]{2,6}$)/,
    domUtil = {}, zoomBox = { curImgIdx: 0 };

  function findThumbsRgx(img) {
    var custom = jq(img).parents('[data-zoombox-thumbrgx]')[0], rx;
    console.log('rgx?', custom, img);
    if (!custom) { return defaultThumbRgx; }
    rx = custom.zoomboxThumbRgx;
    if (!rx) {
      rx = new RegExp(custom.getAttribute('data-zoombox-thumbrgx'));
      custom.zoomboxThumbRgx = rx;
    }
    return rx;
  }

  function ignoreUnusedArg() { return; }

  function rescan() {
    jq('.zoombox img').each(function (matchIdx, pic) {
      ignoreUnusedArg(matchIdx);
      if (pic.zoomboxed) { return; }
      var lnk = pic.parentNode, imgIdx, thumbRgx;
      if (String((lnk || {}).tagName || '').toLowerCase() !== 'a') { return; }
      /* match only thumbs = avoid icons and smileys: */
      thumbRgx = findThumbsRgx(pic);
      if (!thumbRgx.exec(pic.src || '')) { return; }
      imgIdx = zoomImgs.length;
      zoomImgs[imgIdx] = pic;
      jq(lnk).on('click', function () { return zoomBox.showPic(imgIdx); });
      pic.zoomboxed = true;
    });
  }
  jq(document).on('ready', rescan);
  window.zoomboxBkml2014pmb_rescan = rescan;

  domUtil.makeFiller = function (elem) {
    jq(elem).addClass('zoombox-fill');
    return elem;
  };

  domUtil.findOrMake = function (idOrClass, parent, tagName) {
    var elem = (parent
      ? jq(parent).find('.' + idOrClass)[0]
      : document.getElementById(idOrClass));
    if (!elem) { elem = document.createElement(tagName || 'div'); }
    if (!parent) { elem.id = idOrClass; }
    elem.className = idOrClass;
    (parent || body).appendChild(elem);
    return elem;
  };

  zoomBox.findOrMake = function (idOrClass, parent, tagName) {
    return domUtil.findOrMake('zoombox-' + idOrClass, parent, tagName);
  };

  zoomBox.fadeWrapper = zoomBox.findOrMake('wrapper');
  domUtil.makeFiller(zoomBox.fadeWrapper);

  zoomBox.hide = function () {
    zoomBox.fadeWrapper.style.display = 'none';
    return false;
  };
  zoomBox.hide();

  zoomBox.fade = (function () {
    var el = zoomBox.findOrMake('fade', zoomBox.fadeWrapper);
    domUtil.makeFiller(el);
    jq(el).on('click', zoomBox.hide);
    return el;
  }());

  zoomBox.lightboxPosi = (function () {
    var el = zoomBox.findOrMake('lightbox-posi', zoomBox.fadeWrapper);
    domUtil.makeFiller(el);
    jq(el).on('click', zoomBox.hide);
    return el;
  }());

  zoomBox.lightbox = zoomBox.findOrMake('lightbox', zoomBox.lightboxPosi);
  jq(zoomBox.lightbox).on('click', /* prevent bubbling to wrapper: */ false);

  zoomBox.shadow = zoomBox.findOrMake('shadow', zoomBox.lightbox);

  zoomBox.imageWrapper = zoomBox.findOrMake('imgwrap', zoomBox.lightbox);
  domUtil.makeFiller(zoomBox.imageWrapper);

  zoomBox.imageLoadMsg = zoomBox.findOrMake('imgload', zoomBox.imageWrapper);
  domUtil.makeFiller(zoomBox.imageLoadMsg);

  zoomBox.imageFull = (function () {
    var el = zoomBox.findOrMake('imgfull', zoomBox.imageWrapper, 'img');
    el.onload = function fullImageLoaded() {
      if ((el.width > el.thumbWidth) || (el.height > el.thumbHeight)) {
        zoomBox.adaptToImageSize(el.width, el.height);
        zoomBox.imageLoadMsg.style.display = 'none';
      }
    };
    return el;
  }());

  zoomBox.styleSheet = zoomBox.findOrMake('css', null, 'style');
  zoomBox.styleSheet.type = 'text/css';
  zoomBox.styleSheet.innerHTML = [
    '~navlink, ~fill, ~shadow {',
    '  display: block;',
    '  position: absolute;',
    '  top: 0px;',
    '  bottom: 0px;',
    '  margin: 0px;',
    '}',
    '~fill { left: 0px; right: 0px; }',
    '~wrapper { position: fixed !important; }',
    '~fade, ~shadow { opacity: 0.4; background: black; }',
    '~lightbox {',
    '  position: absolute;',
    '  left: 50%;',
    '  top: 30%;',
    '  background: lightgrey;',
    '}',
    '~shadow {',
    '  font-size: 40px;',
    '  top: -1em;',
    '  left: -1em;',
    '  right: -1em;',
    '  bottom: -1em;',
    '  opacity: 0.7;',
    '}',
    '~imgwrap { overflow: hidden; }',
    '~imgload { background: none no-repeat center center; opacity: 0.3; }',
    '~imgfull { position: relative; border: 0px; }',
    '~navlink {',
    '  width: 3em;',
    '  font-size: 50px;',
    '  text-decoration: none;',
    '  vertical-align: bottom;',
    '}',
    '~navlink:hover {',
    '  background: white;',
    '  opacity: 0.3;',
    '}',
    '~navlink span {',
    '  display: none;',
    '  position: absolute;',
    '  margin: 0px;',
    '  padding: 0ex 1ex;',
    '  color: black;',
    '}',
    '~navlink span:nth-child(1) { top: 1ex; }',
    '~navlink span:nth-child(2) { top: 48%; }',
    '~navlink span:nth-child(3) { bottom: 1ex; }',
    '~navprev, ~navprev span { left: 0px; }',
    '~navnext, ~navnext span { right: 0px; }',
    '~navlink:hover span { display: inline; }',
    ''
  ].join('\n').replace(/\~/g, '.zoombox-');

  zoomBox.naviButtonMake = function (forward) {
    var el, dir = (forward ? 'next' : 'prev'),
      spans = '<span>' + (forward ? '&raquo;' : '&laquo;') + '</span>';
    el = zoomBox.findOrMake('nav' + dir, zoomBox.imageWrapper, 'a');
    el.innerHTML = spans + spans + spans;
    el.className += ' zoombox-navlink';
    el.href = 'zoombox://' + dir;
    jq(el).on('click', function () {
      var destIdx = (zoomBox.curImgIdx + (forward ? 1 : -1) +
        zoomImgs.length) % zoomImgs.length;
      setTimeout(zoomBox.showPic.bind(null, destIdx), 10);
      return false;
    });
    return el;
  };
  zoomBox.naviButtonPrev = zoomBox.naviButtonMake(false);
  zoomBox.naviButtonNext = zoomBox.naviButtonMake(true);

  zoomBox.adaptToImageSize = function (w, h) {
    w = String(Math.max(w, 100)) + 'px';
    h = String(Math.max(h, 100)) + 'px';
    jq(zoomBox.lightboxPosi).css({ right: w, bottom: h });
    jq(zoomBox.lightbox).css({ width: w, height: h });
  };

  zoomBox.showPic = function (picIdx) {
    var imgFull = zoomBox.imageFull, thumb = zoomImgs[picIdx],
      loadSt = zoomBox.imageLoadMsg.style;
    zoomBox.curImgIdx = picIdx;
    zoomBox.fadeWrapper.style.display = 'block';
    imgFull.src = 'about:blank';
    if (!imgFull.fullSrc) {
      zoomBox.adaptToImageSize(thumb.width * 1.5, thumb.height * 1.5);
    }
    loadSt.backgroundImage = 'url(' + thumb.src + ')';
    loadSt.display = 'block';
    imgFull.fullSrc = thumb.parentNode.href;
    imgFull.thumbWidth = thumb.width;
    imgFull.thumbHeight = thumb.height;
    setTimeout(function () { imgFull.src = imgFull.fullSrc; }, 10);
    return false;
  };

  (function (e) { // AMD export
    /*global define: true */
    var d = ((typeof define === 'function') && define),
      m = ((typeof module === 'object') && module);
    if (d && d.amd) { d(function () { return e; }); }
    if (m && m.exports) { m.exports = e; }
  }(rescan));
}());
