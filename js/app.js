const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1Y6lEPBEG89ytUAk_SeT8_Ykr0bJckj6x8UrriPjbd0Q/export?format=csv&gid=0';

let PRODUCTOS = [];

function whatsappLink(numero, nombre){
  const msg = encodeURIComponent('Hola, me interesa el producto ' + nombre + ' que vi en la pagina de Terrana.');
  return 'https://wa.me/' + (numero||'').toString().replace(/[^0-9]/g,'') + '?text=' + msg;
}

async function cargarProductos(){
  if(PRODUCTOS.length) return PRODUCTOS;
  return new Promise((resolve)=>{
    Papa.parse(SHEET_CSV_URL, {
      download:true,
      header:true,
      skipEmptyLines:true,
      complete: function(results){
        PRODUCTOS = results.data.filter(p=>p.codigo);
        resolve(PRODUCTOS);
      },
      error: function(){ resolve([]); }
    });
  });
}

function imagenesDe(p){
  return [p.imagen1,p.imagen2,p.imagen3,p.imagen4].filter(x=>x && x.trim());
}

const CATEGORIAS_INFO = {
  'Carteras': 'assets/imagenes/cat-carteras.jpg',
  'Billeteras': 'assets/imagenes/cat-billeteras.jpg',
  'Correas': 'assets/imagenes/cat-correas.jpg',
  'Accesorios': 'assets/imagenes/cat-accesorios.jpg',
  'Blusas': 'assets/imagenes/cat-blusas.jpg',
  'Chalecos': 'assets/imagenes/cat-chalecos.jpg'
};

async function cargarColecciones(){
  const grid = document.getElementById('collections-grid');
  if(!grid) return;
  await cargarProductos();
  const categorias = [...new Set(PRODUCTOS.map(p=>p.categoria))];
  grid.innerHTML = categorias.map(cat => `
    <a class="collection-card" href="productos.html?categoria=${encodeURIComponent(cat)}">
      <img src="${CATEGORIAS_INFO[cat] || 'assets/imagenes/placeholder.jpg'}" alt="${cat}" onerror="this.src='assets/imagenes/placeholder.jpg'">
      <div class="overlay"><h3>${cat}</h3></div>
    </a>
  `).join('');
}

function crearTarjetaProducto(p){
  const imgs = imagenesDe(p);
  const img = imgs[0] || 'assets/imagenes/placeholder.jpg';
  return `
    <a class="product-card" href="producto.html?codigo=${encodeURIComponent(p.codigo)}">
      <div class="img-wrap">
        ${p.estado ? `<span class="product-status">${p.estado}</span>` : ''}
        <img src="${img}" alt="${p.nombre}" onerror="this.src='assets/imagenes/placeholder.jpg'">
      </div>
      <div class="product-info">
        <h4>${p.nombre}</h4>
        <p class="product-price">${p.precio ? 'S/ ' + p.precio : 'Consultar'}</p>
      </div>
    </a>
  `;
}

async function cargarProductosPagina(){
  const grid = document.getElementById('products-grid');
  if(!grid) return;
  await cargarProductos();
  const params = new URLSearchParams(window.location.search);
  const catParam = params.get('categoria');
  const buscarParam = params.get('buscar') || '';
  const searchPageEl = document.getElementById('search-input-page');
  if(searchPageEl && buscarParam && !searchPageEl.value) searchPageEl.value = buscarParam;
  const buscar = (searchPageEl?.value || buscarParam || '').toLowerCase();

  let lista = PRODUCTOS;
  if(catParam) lista = lista.filter(p=>p.categoria === catParam);
  if(buscar) lista = lista.filter(p=>p.nombre.toLowerCase().includes(buscar) || p.codigo.toLowerCase().includes(buscar));

  const filtroEstado = document.getElementById('filtro-estado');
  if(filtroEstado && filtroEstado.value) lista = lista.filter(p=>p.estado === filtroEstado.value);

  const orden = document.getElementById('filtro-orden');
  if(orden && orden.value === 'precio-asc') lista = [...lista].sort((a,b)=> (parseFloat(a.precio)||0) - (parseFloat(b.precio)||0));
  if(orden && orden.value === 'precio-desc') lista = [...lista].sort((a,b)=> (parseFloat(b.precio)||0) - (parseFloat(a.precio)||0));

  const pageTitle = document.getElementById('page-title');
  if(pageTitle) pageTitle.textContent = catParam || 'Todos los productos';
  grid.innerHTML = lista.map(crearTarjetaProducto).join('') || '<p>No se encontraron productos.</p>';

  const catSelect = document.getElementById('filtro-categoria');
  if(catSelect && !catSelect.dataset.filled){
    const categorias = [...new Set(PRODUCTOS.map(p=>p.categoria))];
    catSelect.innerHTML = '<option value="">Todas las categorias</option>' + categorias.map(c=>`<option value="${c}" ${c===catParam?'selected':''}>${c}</option>`).join('');
    catSelect.dataset.filled = '1';
    catSelect.addEventListener('change', ()=>{
      const url = new URL(window.location.href);
      if(catSelect.value) url.searchParams.set('categoria', catSelect.value); else url.searchParams.delete('categoria');
      window.location.href = url.toString();
    });
  }
}

async function cargarFichaProducto(){
  const cont = document.getElementById('product-detail');
  if(!cont) return;
  await cargarProductos();
  const params = new URLSearchParams(window.location.search);
  const codigo = params.get('codigo');
  const p = PRODUCTOS.find(x=>x.codigo === codigo);
  if(!p){ cont.innerHTML = '<p>Producto no encontrado.</p>'; return; }

  const imgs = imagenesDe(p);
  const imgPrincipal = imgs[0] || 'assets/imagenes/placeholder.jpg';

  document.title = p.nombre + ' | Terrana';

  cont.innerHTML = `
    <div class="gallery">
      <div class="gallery-main"><img id="main-img" src="${imgPrincipal}" alt="${p.nombre}" onerror="this.src='assets/imagenes/placeholder.jpg'"></div>
      <div class="gallery-thumbs">
        ${imgs.map((im,i)=>`<img src="${im}" class="${i===0?'active':''}" onclick="document.getElementById('main-img').src=this.src; document.querySelectorAll('.gallery-thumbs img').forEach(t=>t.classList.remove('active')); this.classList.add('active');" onerror="this.style.display='none'">`).join('')}
      </div>
    </div>
    <div class="detail-info">
      <h1>${p.nombre}</h1>
      <p class="detail-code">Codigo: ${p.codigo}</p>
      <p>${p.descripcion || ''}</p>
      <div class="detail-meta">
        ${p.material ? `<p><strong>Material:</strong> ${p.material}</p>` : ''}
        ${p.colores ? `<p><strong>Colores:</strong> ${p.colores}</p>` : ''}
        ${p.medidas ? `<p><strong>Medidas:</strong> ${p.medidas}</p>` : ''}
      </div>
      <p class="detail-price">${p.precio ? 'S/ ' + p.precio : 'Consultar precio'}</p>
      <a class="btn btn-whatsapp" target="_blank" rel="noopener" href="${whatsappLink(p.whatsapp, p.nombre)}">Consultar por WhatsApp</a>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', function(){
  const menuToggle = document.getElementById('menu-toggle');
  const mainNav = document.getElementById('main-nav');
  if(menuToggle) menuToggle.addEventListener('click', ()=> mainNav.classList.toggle('active'));

  const searchToggle = document.getElementById('search-toggle');
  const searchBar = document.getElementById('search-bar');
  if(searchToggle) searchToggle.addEventListener('click', ()=> searchBar.classList.toggle('active'));

  const searchInput = document.getElementById('search-input');
  if(searchInput){
    searchInput.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' && searchInput.value.trim()){
        window.location.href = 'productos.html?buscar=' + encodeURIComponent(searchInput.value.trim());
      }
    });
  }

  cargarProductosPagina();
  cargarFichaProducto();

  const filtroEstado = document.getElementById('filtro-estado');
  if(filtroEstado) filtroEstado.addEventListener('change', cargarProductosPagina);
  const filtroOrden = document.getElementById('filtro-orden');
  if(filtroOrden) filtroOrden.addEventListener('change', cargarProductosPagina);
  const searchPage = document.getElementById('search-input-page');
  if(searchPage) searchPage.addEventListener('input', cargarProductosPagina);
});
