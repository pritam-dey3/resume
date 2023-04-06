<section id="${post.section}">
  <div class="container">
    <h2>${post.title()}</h2>
    % if post.description():
      <p>${post.description()}</p>
    % endif
    <ul>
      % for item in post.listing():
        <li>${item}</li>
      % endfor
    </ul>
  </div>
</section>
