<?php defined('ABSPATH') || exit; ?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head><meta charset="<?php bloginfo('charset'); ?>"><meta name="viewport" content="width=device-width, initial-scale=1"><?php wp_head(); ?></head>
<body <?php body_class(); ?> data-archive-view="<?php echo esc_attr(vinyl_archive_view()); ?>" data-collection-url="<?php echo esc_url(home_url('/?pagename=koleksiyon')); ?>">
<?php wp_body_open(); ?>
<a class="skip-link" href="#main-content">İçeriğe geç</a>
