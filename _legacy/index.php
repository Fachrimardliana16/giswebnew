<?php 
session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit();
}

require_once 'config.php';
?>

<?php include 'layout/head.php'; ?>
<?php include 'layout/header.php'; ?>

<div class="flex-1 flex overflow-hidden">
    <?php include 'layout/sidebar.php'; ?>
    
    <!-- Main Map Content -->
    <main class="flex-1 flex flex-col">
        <div class="map-container">
            <div id="map"></div>
            
            <!-- Loading indicator -->
            <div id="loadingIndicator" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
                    <svg class="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading...</span>
                </div>
            </div>
        </div>
    </main>
</div>

<?php include 'layout/footer.php'; ?>

<script>
$(document).ajaxStart(function() {
    $('#loadingIndicator').removeClass('hidden');
}).ajaxStop(function() {
    $('#loadingIndicator').addClass('hidden');
});

window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error: ' + msg + '\nURL: ' + url + '\nLine: ' + lineNo + '\nColumn: ' + columnNo);
    if (error && error.stack) {
        console.error('Stack: ' + error.stack);
    }
    return false;
};
</script>