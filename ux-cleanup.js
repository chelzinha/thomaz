'use strict';

(() => {
  const taskDialog = document.querySelector('#taskDialog');
  const infoDialog = document.querySelector('#infoDialog');
  const taskForm = document.querySelector('#taskForm');

  function blurActiveElement() {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }

  function closeTaskDialog() {
    if (!taskDialog?.open) return;
    blurActiveElement();
    taskForm?.reset();
    taskDialog.close('cancel');
  }

  function closeInfoDialog() {
    if (!infoDialog?.open) return;
    blurActiveElement();
    infoDialog.close('cancel');
  }

  function normalizeDialogButtons() {
    const taskClose = taskDialog?.querySelector('.close-button');
    const taskCancel = taskDialog?.querySelector('.secondary-button[value="cancel"]');
    const infoClose = infoDialog?.querySelector('.close-button');

    if (taskClose) taskClose.type = 'button';
    if (taskCancel) taskCancel.type = 'button';
    if (infoClose) infoClose.type = 'button';
  }

  function setupDialog(dialog, closeHandler) {
    if (!dialog) return;

    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      closeHandler();
    });

    dialog.addEventListener('click', event => {
      if (event.target === dialog) closeHandler();
    });
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;

    if (
      button.closest('#taskDialog') &&
      (button.matches('.close-button') || button.matches('.secondary-button[value="cancel"]'))
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeTaskDialog();
      return;
    }

    if (button.closest('#infoDialog') && button.matches('.close-button')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeInfoDialog();
    }
  }, true);

  function keepFocusedFieldVisible(event) {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
    if (!field.closest('dialog')) return;

    window.setTimeout(() => {
      field.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 280);
  }

  document.addEventListener('focusin', keepFocusedFieldVisible);

  normalizeDialogButtons();
  setupDialog(taskDialog, closeTaskDialog);
  setupDialog(infoDialog, closeInfoDialog);

  window.addEventListener('orientationchange', () => {
    window.setTimeout(() => window.scrollTo({ left: 0, behavior: 'auto' }), 150);
  });
})();
