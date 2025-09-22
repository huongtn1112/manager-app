document.addEventListener('DOMContentLoaded', async () => {
    const storageManager = new StorageManager();

    try {
        // Load data
        const todos = await storageManager.loadAll('todo');

        // Calculate statistics
        const totalTasks = todos.length;
        const completedTasks = todos.filter(task => task.completed).length;
        const remainingTasks = totalTasks - completedTasks;

        // Update summary elements
        document.getElementById('total-tasks').textContent = totalTasks;
        document.getElementById('completed-tasks').textContent = completedTasks;
        document.getElementById('remaining-tasks').textContent = remainingTasks;

        // Render chart
        const ctx = document.getElementById('tasks-chart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Hoàn thành', 'Còn lại'],
                datasets: [{
                    label: 'Trạng thái công việc',
                    data: [completedTasks, remainingTasks],
                    backgroundColor: [
                        '#28a745', // Green for completed
                        '#ffc107'  // Yellow for remaining
                    ],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: 'Biểu đồ trạng thái công việc',
                        font: {
                            size: 18
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Lỗi khi tải hoặc hiển thị thống kê:', error);
        // Display an error message to the user
        const statsSection = document.querySelector('.statistics-section');
        statsSection.innerHTML = '<p class="error-message">Đã xảy ra lỗi khi tải dữ liệu thống kê. Vui lòng thử lại sau.</p>';
    }
});
