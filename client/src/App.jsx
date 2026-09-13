import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import { ProtectedRoute, RoleRoute, GuestRoute } from './components/RouteGuards';
import { Spinner } from './components/Skeletons';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Buyer dashboard
const AccountOverview = lazy(() => import('./pages/account/Overview'));
const AccountOrders = lazy(() => import('./pages/account/Orders'));
const AccountOrderDetail = lazy(() => import('./pages/account/OrderDetail'));
const AccountReturns = lazy(() => import('./pages/account/Returns'));
const AccountAddresses = lazy(() => import('./pages/account/Addresses'));
const AccountProfile = lazy(() => import('./pages/account/Profile'));
const AccountReviews = lazy(() => import('./pages/account/Reviews'));
const AccountPayments = lazy(() => import('./pages/account/Payments'));
const Notifications = lazy(() => import('./pages/account/Notifications'));
const WishlistPage = lazy(() => import('./pages/account/WishlistPage'));

// Seller dashboard
const SellerOverview = lazy(() => import('./pages/seller/Overview'));
const SellerProducts = lazy(() => import('./pages/seller/Products'));
const SellerProductForm = lazy(() => import('./pages/seller/ProductForm'));
const SellerOrders = lazy(() => import('./pages/seller/Orders'));
const SellerAnalytics = lazy(() => import('./pages/seller/Analytics'));

// Admin dashboard
const AdminOverview = lazy(() => import('./pages/admin/Overview'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminSellers = lazy(() => import('./pages/admin/Sellers'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminBrands = lazy(() => import('./pages/admin/Brands'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminPayments = lazy(() => import('./pages/admin/Payments'));
const AdminCoupons = lazy(() => import('./pages/admin/Coupons'));
const AdminReviews = lazy(() => import('./pages/admin/Reviews'));
const AdminReturns = lazy(() => import('./pages/admin/Returns'));
const AdminNotifications = lazy(() => import('./pages/admin/Notifications'));

const Page = ({ children }) => <Suspense fallback={<Spinner />}>{children}</Suspense>;

const App = () => (
  <Routes>
    <Route element={<MainLayout />}>
      <Route path="/" element={<Page><Home /></Page>} />
      <Route path="/shop" element={<Page><Shop /></Page>} />
      <Route path="/product/:slug" element={<Page><ProductDetail /></Page>} />
      <Route path="/cart" element={<Page><ProtectedRoute><Cart /></ProtectedRoute></Page>} />
      <Route path="/checkout" element={<Page><ProtectedRoute><Checkout /></ProtectedRoute></Page>} />
      <Route path="/order-success/:id" element={<Page><ProtectedRoute><OrderSuccess /></ProtectedRoute></Page>} />
      <Route path="/wishlist" element={<Page><ProtectedRoute><Wishlist /></ProtectedRoute></Page>} />
      <Route path="/login" element={<Page><GuestRoute><Login /></GuestRoute></Page>} />
      <Route path="/register" element={<Page><GuestRoute><Register /></GuestRoute></Page>} />
      <Route path="/forgot-password" element={<Page><GuestRoute><ForgotPassword /></GuestRoute></Page>} />
      <Route path="/reset-password" element={<Page><ResetPassword /></Page>} />
      <Route path="*" element={<Page><NotFound /></Page>} />
    </Route>

    {/* Buyer dashboard */}
    <Route path="/account" element={<Page><ProtectedRoute><DashboardLayout role="buyer" /></ProtectedRoute></Page>}>
      <Route index element={<AccountOverview />} />
      <Route path="orders" element={<AccountOrders />} />
      <Route path="orders/:id" element={<AccountOrderDetail />} />
      <Route path="returns" element={<AccountReturns />} />
      <Route path="addresses" element={<AccountAddresses />} />
      <Route path="profile" element={<AccountProfile />} />
      <Route path="reviews" element={<AccountReviews />} />
      <Route path="payments" element={<AccountPayments />} />
      <Route path="notifications" element={<Notifications />} />
      <Route path="wishlist" element={<WishlistPage />} />
    </Route>

    {/* Seller dashboard */}
    <Route path="/seller" element={<Page><RoleRoute roles={['seller']}><DashboardLayout role="seller" /></RoleRoute></Page>}>
      <Route index element={<SellerOverview />} />
      <Route path="products" element={<SellerProducts />} />
      <Route path="products/new" element={<SellerProductForm />} />
      <Route path="products/:id/edit" element={<SellerProductForm />} />
      <Route path="orders" element={<SellerOrders />} />
      <Route path="analytics" element={<SellerAnalytics />} />
    </Route>

    {/* Admin dashboard */}
    <Route path="/admin" element={<Page><RoleRoute roles={['admin']}><DashboardLayout role="admin" /></RoleRoute></Page>}>
      <Route index element={<AdminOverview />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="sellers" element={<AdminSellers />} />
      <Route path="products" element={<AdminProducts />} />
      <Route path="categories" element={<AdminCategories />} />
      <Route path="brands" element={<AdminBrands />} />
      <Route path="orders" element={<AdminOrders />} />
      <Route path="payments" element={<AdminPayments />} />
      <Route path="coupons" element={<AdminCoupons />} />
      <Route path="reviews" element={<AdminReviews />} />
      <Route path="returns" element={<AdminReturns />} />
      <Route path="notifications" element={<AdminNotifications />} />
    </Route>
  </Routes>
);

export default App;
