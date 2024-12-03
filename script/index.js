  // Seleciona o botão e os itens do menu
  const hamburger = document.getElementById('hamburger');
  const menuItems = document.getElementById('menu-items');

  // Adiciona evento de clique ao botão
  hamburger.addEventListener('click', () => {
  menuItems.classList.toggle('active'); // Alterna a classe 'active'
  });

  // Seleciona o botão
  const button = document.querySelector('.glow-on-hover');
  
  // Variável para verificar quando o usuário parou de rolar
  let isScrolling;

  // Adiciona evento de rolagem da página
  window.addEventListener('scroll', function() {
    // Calcula a opacidade com base na rolagem
    let scrollPosition = window.scrollY; // Pega a posição atual da rolagem
    let opacity = 1 - scrollPosition / 500; // Opacidade diminui conforme o usuário rola

    // Garante que a opacidade não fique abaixo de 0
    if (opacity < 0) opacity = 0;

    // Aplica a opacidade ao botão
    button.style.opacity = opacity;

    // Limpa o tempo de espera de rolagem anterior
    window.clearTimeout(isScrolling);

    // Define um novo timeout para detectar quando a rolagem parar
    isScrolling = setTimeout(function() {
      // Quando a rolagem parar, a opacidade volta a 1
      button.style.opacity = 1;
    }, 66); // Um pequeno atraso de 66ms para detectar o fim da rolagem
  });
