import { ConfigManager } from './configManager.js';

export function renderOptionsPanel(containerElement: HTMLElement, manager: ConfigManager): void {
  const config = manager.getConfig();

  containerElement.innerHTML = `
    <div class="ownership-radar-options" style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding: 16px; border: 1px solid #d0d7de; border-radius: 6px; background-color: #f6f8fa;">
      <h2 style="margin-top: 0; font-size: 18px; color: #1f2328;">Ownership Radar - Team Lead Custom Weights</h2>
      <p style="font-size: 13px; color: #636c76;">Override scoring weights and role multipliers to dynamically prioritize code ownership suggestions (e.g. boost review counts for mentors).</p>

      <form id="weights-form" style="display: flex; flex-direction: column; gap: 12px; max-width: 450px;">
        <div>
          <label style="font-weight: 600; display: block; font-size: 12px;">Commits Weight (0.0 - 1.0):</label>
          <input type="number" step="0.05" min="0" max="1" name="commits" value="${config.weights.commits}" style="width: 100%; padding: 4px 8px; border: 1px solid #d0d7de; border-radius: 4px;" />
        </div>

        <div>
          <label style="font-weight: 600; display: block; font-size: 12px;">Lines Changed Weight (0.0 - 1.0):</label>
          <input type="number" step="0.05" min="0" max="1" name="linesChanged" value="${config.weights.linesChanged}" style="width: 100%; padding: 4px 8px; border: 1px solid #d0d7de; border-radius: 4px;" />
        </div>

        <div>
          <label style="font-weight: 600; display: block; font-size: 12px;">Reviews Count Weight (0.0 - 1.0):</label>
          <input type="number" step="0.05" min="0" max="1" name="reviewsCount" value="${config.weights.reviewsCount}" style="width: 100%; padding: 4px 8px; border: 1px solid #d0d7de; border-radius: 4px;" />
        </div>

        <div>
          <label style="font-weight: 600; display: block; font-size: 12px;">Recency Weight (0.0 - 1.0):</label>
          <input type="number" step="0.05" min="0" max="1" name="recency" value="${config.weights.recency}" style="width: 100%; padding: 4px 8px; border: 1px solid #d0d7de; border-radius: 4px;" />
        </div>

        <hr style="border: none; border-top: 1px solid #d0d7de; margin: 8px 0;" />

        <div>
          <label style="font-weight: 600; display: block; font-size: 12px;">Mentor Review Count Multiplier (e.g. 1.5x):</label>
          <input type="number" step="0.1" min="1" max="5" name="mentorReviewMultiplier" value="${config.roleMultipliers.mentorReviewMultiplier}" style="width: 100%; padding: 4px 8px; border: 1px solid #d0d7de; border-radius: 4px;" />
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="customOverridesEnabled" name="customOverridesEnabled" ${config.customOverridesEnabled ? 'checked' : ''} />
          <label for="customOverridesEnabled" style="font-size: 13px;">Enable Custom Overrides</label>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button type="submit" style="background-color: #1f883d; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600;">Save Settings</button>
          <button type="button" id="reset-defaults-btn" style="background-color: #f3f4f6; color: #24292f; border: 1px solid #d0d7de; padding: 6px 12px; border-radius: 6px; cursor: pointer;">Reset Defaults</button>
        </div>
      </form>
      <div id="save-status" style="margin-top: 10px; font-size: 12px; color: #1f883d; font-weight: 600;"></div>
    </div>
  `;

  const form = containerElement.querySelector('#weights-form') as HTMLFormElement;
  const statusDiv = containerElement.querySelector('#save-status') as HTMLDivElement;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    manager.updateWeights({
      commits: parseFloat(formData.get('commits') as string) || 0.4,
      linesChanged: parseFloat(formData.get('linesChanged') as string) || 0.2,
      reviewsCount: parseFloat(formData.get('reviewsCount') as string) || 0.3,
      recency: parseFloat(formData.get('recency') as string) || 0.1,
    });

    manager.updateRoleMultipliers({
      mentorReviewMultiplier: parseFloat(formData.get('mentorReviewMultiplier') as string) || 1.5,
    });

    manager.setCustomOverridesEnabled(formData.get('customOverridesEnabled') === 'on');

    if (statusDiv) {
      statusDiv.textContent = 'Settings saved successfully!';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 3000);
    }
  });

  const resetBtn = containerElement.querySelector('#reset-defaults-btn') as HTMLButtonElement;
  resetBtn.addEventListener('click', () => {
    manager.resetToDefaults();
    renderOptionsPanel(containerElement, manager);
  });
}
