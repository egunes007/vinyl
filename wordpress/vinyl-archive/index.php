<?php defined('ABSPATH') || exit; get_header(); ?>
<header><a class="brand" href="<?php echo esc_url(home_url('/')); ?>">◉ VINYL ARCHIVE</a></header>
<main id="main-content" class="section wp-content">
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
<article <?php post_class(); ?>>
<h1><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h1>
<?php the_content(); wp_link_pages(); ?>
</article>
<?php endwhile; the_posts_pagination(); else : ?>
<h1>İçerik bulunamadı</h1><a class="button" href="<?php echo esc_url(home_url('/')); ?>">Ana sayfaya dön</a>
<?php endif; ?>
</main>
<?php get_footer(); ?>
