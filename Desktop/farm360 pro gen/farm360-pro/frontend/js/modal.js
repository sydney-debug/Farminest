// Farm360 Pro - Modal Module

class Modal {
  constructor(app) {
    this.app = app;
    this.overlay = document.getElementById('modalOverlay');
    this.modal = document.getElementById('modal');
    this.title = document.getElementById('modalTitle');
    this.body = document.getElementById('modalBody');
  }

  open(title, content) {
    this.title.textContent = title;
    this.body.innerHTML = content;
    this.overlay.classList.add('active');

    // Focus first form input if present
    const firstInput = this.body.querySelector('input, select, textarea');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  close() {
    this.overlay.classList.remove('active');
    this.body.innerHTML = '';
  }

  // Helper method to create form modals
  createFormModal(title, fields, onSubmit) {
    const form = document.createElement('form');
    form.className = 'modal-form';

    fields.forEach(field => {
      const formGroup = document.createElement('div');
      formGroup.className = 'form-group';

      const label = document.createElement('label');
      label.textContent = field.label;
      label.setAttribute('for', field.id);

      let input;
      if (field.type === 'select') {
        input = document.createElement('select');
        field.options.forEach(option => {
          const optionEl = document.createElement('option');
          optionEl.value = option.value;
          optionEl.textContent = option.label;
          if (option.selected) optionEl.selected = true;
          input.appendChild(optionEl);
        });
      } else if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = field.rows || 3;
      } else {
        input = document.createElement('input');
        input.type = field.type || 'text';
      }

      input.id = field.id;
      input.name = field.id;
      if (field.required) input.required = true;
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.value) input.value = field.value;

      formGroup.appendChild(label);
      formGroup.appendChild(input);
      form.appendChild(formGroup);
    });

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'modal-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.close());

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'Save';

    buttonGroup.appendChild(cancelBtn);
    buttonGroup.appendChild(submitBtn);
    form.appendChild(buttonGroup);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = {};
      fields.forEach(field => {
        formData[field.id] = form.querySelector(`#${field.id}`).value;
      });
      onSubmit(formData);
    });

    this.open(title, form.outerHTML);
  }
}
